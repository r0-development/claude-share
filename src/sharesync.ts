/** The share cycle — the one entry point for cs sync, the hooks and the timer: project state copied back from the checkouts
 *  → commit → fetch → fast-forward or rebase (union attrs for memory and plans) → a file changed on both machines settled per
 *  file → push → ~/.claude re-rendered and project state placed when the pull brought anything. Asking is a function the
 *  caller passes (`ask`); without one (the hooks, the timer, `cs sync` with no terminal) the newest change wins per file.
 *  The share is never left mid-rebase: a file `ask` must decide is asked with the rebase aborted — the share exactly as it
 *  was, so Ctrl-C or a closed terminal at the prompt leaves nothing behind — then the rebase runs again with the answers.
 *  Anything git stops on that is not a plain both-sides change aborts the rebase and is reported. Nothing is lost — this
 *  machine's commits are kept in refs/cs/backup/share/<time> before a rebase is settled. */
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as git from "./git.js";
import { contract, stateDir } from "./paths.js";
import { acquire } from "./lock.js";
import { commit, reload, type Share } from "./share.js";
import { runApply } from "./apply.js";
import { placeAll } from "./projectstate.js";
import * as ui from "./ui.js";

/** When the share last synced here (ISO time, or "offline" when the last attempt could not fetch); what bare cs and cs doctor show. */
export const lastSyncFile = () => join(stateDir(), "last-sync");
export const lastSync = (): string | undefined => (existsSync(lastSyncFile()) ? readFileSync(lastSyncFile(), "utf8").trim() : undefined);
const markSync = (what: string) => { mkdirSync(stateDir(), { recursive: true }); writeFileSync(lastSyncFile(), what + "\n"); };

/** Which machine's version of a file wins: `ours` = this machine, `theirs` = the other machine. (During a rebase git's own
 *  ours/theirs are the other way round — stage 2 is the upstream commit, stage 3 the local commit being replayed.) */
export type Side = "ours" | "theirs";
/** A file both machines changed: per side, when it was last changed there and whether that change deleted it. */
export interface Conflict { file: string; ours: Change; theirs: Change }
export interface Change { when: string; deleted: boolean }
/** `ask`: decides a file changed on both machines (asked once per file per run); without it, and for files `resolve` does
 *  not settle, the newest change wins. `resolve`: one side for every file (`--resolve`). `pullOnly` / `pushOnly`: half the
 *  cycle (the hooks). `commitOnly`: commit local changes and stop (cs sync when the first fetch of the run already failed).
 *  `debounce` (seconds): do nothing when a sync ran that recently (the Stop hook fires per Claude turn). */
export interface SyncOpts { pullOnly?: boolean; pushOnly?: boolean; timeout?: number; commitOnly?: boolean; debounce?: number; resolve?: Side | "newest"; ask?: (c: Conflict) => Promise<Side> }
/** `offline`: the fetch failed (or was skipped), local commits are kept for a later push. `pushed`: commits that reached the
 *  remote. `error`: why `ok` is false, as it was printed. */
export interface ShareResult { ok: boolean; offline?: boolean; pushed?: number; error?: string }

/** Newest change wins (a deletion is a change); a tie stays with this machine. */
export const newest = (c: Conflict): Side => (Date.parse(c.theirs.when) > Date.parse(c.ours.when) ? "theirs" : "ours");
/** "changed 2026-09-16 08:00" / "deleted 2026-09-16 08:00" for a prompt hint. */
export const describe = (ch: Change) => `${ch.deleted ? "deleted" : "changed"} ${ch.when.slice(0, 16).replace("T", " ")}`;
const LABEL = "share";
/** An `ok: false` result: printed (what, why, fix) and returned. */
const failed = (what: string, why = "", fix = ""): ShareResult => { ui.error(`${LABEL}: ${what}`, why, fix); return { ok: false, error: [what, why].filter(Boolean).join(" — ") }; };

// ---------------------------------------------------------------- a stopped rebase: what stopped it, taking a side, settling it
function conflictsOf(repo: string, local: string, upstream: string): Conflict[] {
  const change = (tip: string, file: string): Change => ({ when: git.out(["log", "-1", "--format=%cI", tip, "--", file], repo), deleted: !git.out(["ls-tree", tip, "--", file], repo) });
  return git.out(["diff", "--name-only", "--diff-filter=U"], repo).split("\n").filter(Boolean).map((file) => ({ file, ours: change(local, file), theirs: change(upstream, file) }));
}
/** Put one side's version of a conflicted file into the index (or drop the file when that side deleted it). */
function takeSide(repo: string, file: string, side: Side) {
  const stages = git.out(["ls-files", "-u", "--", file], repo).split("\n").filter(Boolean).map((l) => l.split(/\s+/)[2]);
  if (!stages.includes(side === "ours" ? "3" : "2")) { git.git(["rm", "-q", "--cached", "--", file], repo, { check: false }); rmSync(join(repo, file), { force: true }); return; }
  git.git(["checkout", side === "ours" ? "--theirs" : "--ours", "--", file], repo); git.git(["add", "--", file], repo);
}
/** Settle a stopped rebase file by file until it finishes, `decided` (asked earlier this run) and `resolve` first, newest
 *  otherwise. With `ask`, files nothing decides yet abort the rebase and come back for the caller to ask about. Throws
 *  (rebase aborted) when git stops for another reason or the same conflict comes back. */
function settleRebase(repo: string, local: string, upstream: string, byHand: string, o: SyncOpts, decided: Record<string, Side>): Conflict[] | undefined {
  const env = { GIT_EDITOR: "true" }; const ident = git.identityArgs(repo); const settled: string[] = []; let backedUp = false; let last = "";
  const side = (c: Conflict): Side | undefined => {
    if (decided[c.file]) return decided[c.file];
    if (o.resolve === "ours" || o.resolve === "theirs") return o.resolve;
    return o.ask && !o.resolve ? undefined : newest(c);   // asked — unless `--resolve newest` said not to
  };
  const abort = () => git.git(["rebase", "--abort"], repo, { check: false });
  try {
    while (git.rebaseInProgress(repo)) {
      const stops = conflictsOf(repo, local, upstream); const step = git.rebaseStep(repo);   // the same file may stop several local commits; the same step twice means stuck
      if (!stops.length) throw new Error(`cs: share rebase stopped without a conflict — ${byHand}`);
      if (step === last) throw new Error(`cs: share rebase keeps stopping on ${stops.map((c) => c.file).join(", ")} — ${byHand}`);
      last = step;
      const open = stops.filter((c) => !side(c));
      if (open.length) { abort(); return open; }
      if (!backedUp) { git.git(["update-ref", `refs/cs/backup/share/${Date.now()}`, local], repo); backedUp = true; }   // this machine's commits as they were
      for (const c of stops) { const s = side(c)!; takeSide(repo, c.file, s); settled.push(`${c.file} (${s === "ours" ? "this machine" : "the other machine"})`); }
      const empty = git.git(["diff", "--cached", "--quiet"], repo, { check: false }).code === 0;
      const r = git.git([...ident, "rebase", empty ? "--skip" : "--continue"], repo, { check: false, env });
      if (r.code !== 0 && !git.rebaseInProgress(repo)) throw new Error(`cs: share rebase failed — ${git.lastLine(r.err)}`);
    }
  } catch (e) { if (git.rebaseInProgress(repo)) abort(); throw e; }
  ui.step(`${LABEL}: settled ${settled.join(", ")}`);
  return undefined;
}
/** Rebase this machine's commits onto the upstream, asking about what `ask` must decide with the rebase aborted in between;
 *  `decided` holds the answers for the run (a push retry rebases again and must not ask twice). The failure when git stopped
 *  for a reason that is not ours to settle (the share is as it was), nothing when the rebase finished. */
async function rebase(repo: string, o: SyncOpts, decided: Record<string, Side>): Promise<ShareResult | undefined> {
  const byHand = `cd ${contract(repo)} && git rebase ${git.out(["rev-parse", "--abbrev-ref", "@{upstream}"], repo)}`;   // named now: HEAD is detached once the rebase runs
  for (;;) {
    const local = git.out(["rev-parse", "HEAD"], repo), upstream = git.out(["rev-parse", "@{upstream}"], repo);
    const r = git.git([...git.identityArgs(repo), "rebase", "-q", "@{upstream}"], repo, { check: false, env: { GIT_EDITOR: "true" } });
    if (r.code === 0) return undefined;
    if (!git.rebaseInProgress(repo)) return failed("could not rebase", git.lastLine(r.err));
    let open: Conflict[] | undefined;
    try { open = settleRebase(repo, local, upstream, byHand, o, decided); } catch (e: any) { return failed("could not settle the rebase", e.message.replace(/^cs: /, "")); }
    if (!open) return undefined;
    ui.step(`${LABEL}: ${open.length} file(s) changed on both machines — asking`);
    for (const c of open) decided[c.file] = await o.ask!(c);
  }
}

// ---------------------------------------------------------------- the cycle
const rerenders = (file: string) => file.startsWith("claude/") || file.startsWith("projects.toml") || file.startsWith("plans/");
/** Commit → fetch → fast-forward or rebase → push, once the tree is committed. */
async function cycle(share: Share, o: SyncOpts): Promise<ShareResult> {
  const repo = share.path; const timeout = o.timeout ?? 20;
  if (!git.remoteUrl(repo)) { ui.ok(`${LABEL}: no remote configured; local only`); return { ok: true }; }
  if (o.commitOnly) return { ok: true, offline: true };
  const decided: Record<string, Side> = {};
  for (let attempt = 0; ; attempt++) {
    const f = await ui.spin(`${LABEL}: fetching…`, () => git.gitA(["fetch", "-q", "--prune", "origin"], repo, { check: false, timeout }));
    if (f.code !== 0) { ui.warn(`${LABEL}: offline or fetch timed out; will push later`); markSync("offline"); return { ok: true, offline: true }; }
    const branch = git.currentBranch(repo); if (!branch) return failed("detached HEAD; refusing to sync");
    if (!git.out(["rev-parse", "--abbrev-ref", "@{upstream}"], repo)) {
      if (git.out(["rev-parse", "--verify", "-q", `origin/${branch}`], repo)) git.git(["branch", "-q", `--set-upstream-to=origin/${branch}`, branch], repo);
      else if (!o.pullOnly) { await ui.spin(`${LABEL}: pushing…`, () => git.gitA(["push", "-q", "-u", "origin", branch], repo, { timeout })); ui.ok(`${LABEL}: pushed new branch ${branch}`); return { ok: true, pushed: 1 }; }
      else return { ok: true };
    }
    const [ahead, behind] = git.aheadBehind(repo) ?? [0, 0];
    if (behind && !o.pushOnly) {
      if (!ahead) { git.git(["merge", "-q", "--ff-only", "@{upstream}"], repo); ui.step(`${LABEL}: fast-forwarded ${behind} commit(s)`); }
      else { const bad = await rebase(repo, o, decided); if (bad) return bad; ui.step(`${LABEL}: rebased ${ahead} local commit(s) onto ${behind} remote commit(s)`); }
    }
    if (o.pullOnly) { markSync(new Date().toISOString()); return { ok: true, pushed: 0 }; }
    const toPush = git.aheadBehind(repo)?.[0] ?? 0;
    if (toPush) {
      const pr = await ui.spin(`${LABEL}: pushing…`, () => git.gitA(["push", "-q", "origin", branch], repo, { check: false, timeout }));
      if (pr.code !== 0) { if (attempt) return failed("push rejected twice", git.lastLine(pr.err)); ui.warn(`${LABEL}: push rejected, retrying once`); continue; }   // another machine pushed since the fetch
      ui.ok(`${LABEL}: pushed ${toPush} commit(s)`);
    }
    markSync(new Date().toISOString());
    return { ok: true, pushed: toPush };
  }
}
/** One run of the share cycle. What the run prints goes through ui (the caller wraps it in a phase); lines that would say
 *  nothing new are not printed. */
export async function syncShare(share: Share, o: SyncOpts = {}): Promise<ShareResult> {
  const repo = share.path;
  if (o.debounce && existsSync(lastSyncFile()) && Date.now() - statSync(lastSyncFile()).mtimeMs < o.debounce * 1000) return { ok: true };
  if (!git.isRepo(repo)) return failed(`not a git repo (${contract(repo)})`);
  const release = acquire(); if (!release) { ui.info(`${LABEL}: another sync is running, skipping`); return { ok: true }; }
  try {
    if (git.rebaseInProgress(repo)) return failed(`a rebase is in progress in ${contract(repo)}`, "", "finish it: git rebase --continue · or drop it: git rebase --abort");
    const before = git.out(["rev-parse", "HEAD"], repo);
    if (!o.pullOnly) {
      ui.steps(placeAll(share));   // newest checkout content into the project state before it is committed
      if (git.isDirty(repo)) { const n = git.dirtyCount(repo); commit(share, `sync(${share.machine.name}): ${n} file(s) ${new Date().toISOString().slice(0, 16).replace("T", " ")}`); ui.step(`${LABEL}: committed ${n} change(s)`); }
    }
    const r = await cycle(share, o);
    // what moved HEAD this run (a commit here, a pull): ~/.claude when it touched settings, the manifest or plans; project
    // state into every checkout. A --pull-only run (the SessionStart hook) re-renders even when nothing arrived.
    const after = git.out(["rev-parse", "HEAD"], repo);
    if (after !== before || o.pullOnly) {
      if (o.pullOnly || git.out(["diff", "--name-only", before, after], repo).split("\n").some(rerenders)) ui.steps(runApply(reload(share)));   // the pull may have changed the manifest
      ui.steps(placeAll(reload(share)));
    }
    return r;
  } finally { release(); }
}
