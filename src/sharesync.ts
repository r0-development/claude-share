/** share sync: commit → fetch → ff/rebase (union attrs for memory and plans) → conflicts settled per file → push.
 *  The share is never left mid-rebase: a conflict is resolved here (newest wins, or a side the caller decided) or the
 *  rebase is aborted and the files are returned so that cs sync can ask. Nothing is lost — this machine's commits are
 *  kept in refs/cs/backup/share/<time> before a rebase is settled. */
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as git from "./git.js";
import { contract, stateDir } from "./paths.js";
import { acquire } from "./lock.js";
import type { Machine } from "./machine.js";
import { loadManifest, selectedProjects, workspace, type Manifest } from "./manifest.js";
import { runApply } from "./apply.js";
import { checkouts, runLink, syncProject } from "./link.js";
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
/** `resolve`: how conflicts are settled — a side for every file, newest wins per file (the default), or a decision per file.
 *  `ask`: a file `resolve` does not cover aborts the rebase and comes back in `conflicts` for the caller to ask about.
 *  `commitOnly`: commit local changes and stop (cs sync when the first fetch of the run already failed). */
export interface SyncOpts { pullOnly?: boolean; pushOnly?: boolean; timeout?: number; resolve?: Side | "newest" | Record<string, Side>; ask?: boolean; commitOnly?: boolean }
export interface ShareResult { ok: boolean; offline?: boolean; pushed?: number; conflicts?: Conflict[] }

/** Newest change wins (a deletion is a change); a tie stays with this machine. */
export const newest = (c: Conflict): Side => (Date.parse(c.theirs.when) > Date.parse(c.ours.when) ? "theirs" : "ours");
/** "changed 2026-09-16 08:00" / "deleted 2026-09-16 08:00" for a prompt hint. */
export const describe = (ch: Change) => `${ch.deleted ? "deleted" : "changed"} ${ch.when.slice(0, 16).replace("T", " ")}`;
const decide = (c: Conflict, r: SyncOpts["resolve"]): Side | undefined => (r === undefined ? undefined : r === "newest" ? newest(c) : typeof r === "string" ? r : r[c.file]);
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
/** Settle a stopped rebase file by file until it finishes. Returns the files it could not decide (rebase aborted) or nothing;
 *  throws (rebase aborted) when git stops for another reason or the same conflict comes back. */
function settleRebase(repo: string, label: string, local: string, upstream: string, o: SyncOpts): Conflict[] | undefined {
  const env = { GIT_EDITOR: "true" }; const ident = git.identityArgs(repo); const settled: string[] = []; let backedUp = false; let last = "";
  const abort = () => git.git(["rebase", "--abort"], repo, { check: false });
  try {
    while (git.rebaseInProgress(repo)) {
      const stops = conflictsOf(repo, local, upstream); const step = git.rebaseStep(repo);   // the same file may stop several local commits; the same step twice means stuck
      if (!stops.length) throw new Error(`cs: share rebase stopped without a conflict — cd ${contract(repo)} && git rebase origin/${git.currentBranch(repo)}`);
      if (step === last) throw new Error(`cs: share rebase keeps stopping on ${stops.map((c) => c.file).join(", ")} — cd ${contract(repo)} && git rebase origin/${git.currentBranch(repo)}`);
      last = step;
      const open = stops.filter((c) => !decide(c, o.resolve));
      if (open.length && o.ask) { abort(); return open; }
      if (!backedUp) { git.git(["update-ref", `refs/cs/backup/share/${Date.now()}`, local], repo); backedUp = true; }   // this machine's commits as they were
      for (const c of stops) { const side = decide(c, o.resolve) ?? newest(c); takeSide(repo, c.file, side); settled.push(`${c.file} (${side === "ours" ? "this machine" : "the other machine"})`); }
      const empty = git.git(["diff", "--cached", "--quiet"], repo, { check: false }).code === 0;
      const r = git.git([...ident, "rebase", empty ? "--skip" : "--continue"], repo, { check: false, env });
      if (r.code !== 0 && !git.rebaseInProgress(repo)) throw new Error(`cs: share rebase failed — ${r.err.split("\n").pop()}`);
    }
  } catch (e) { if (git.rebaseInProgress(repo)) abort(); throw e; }
  ui.step(`${label}: settled ${settled.join(", ")}`);
  return undefined;
}

/** `offline`: the fetch failed, local commits are kept for a later push. `pushed`: commits that reached the remote.
 *  `conflicts`: only with `ask` — the rebase was aborted, nothing changed; call again with `resolve` set per file. */
export async function shareGitSync(repo: string, label: string, machine: string, o: SyncOpts = {}): Promise<ShareResult> {
  if (!git.isRepo(repo)) { ui.warn(`${label}: not a git repo (${contract(repo)})`); return { ok: false }; }
  const timeout = o.timeout ?? 20;
  const release = acquire(); if (!release) { ui.info(`${label}: another sync is running, skipping`); return { ok: true }; }
  try {
    if (git.rebaseInProgress(repo)) { ui.error(`${label}: a rebase is in progress in ${contract(repo)}`, "", "finish it: git rebase --continue · or drop it: git rebase --abort"); return { ok: false }; }
    if (!o.pullOnly && git.isDirty(repo)) { const n = git.dirtyCount(repo); git.git(["add", "-A"], repo); git.commit(repo, `sync(${machine}): ${n} file(s) ${new Date().toISOString().slice(0, 16).replace("T", " ")}`, "cs", `cs@${machine}`); ui.step(`${label}: committed ${n} change(s)`); }
    if (!git.remoteUrl(repo)) { ui.ok(`${label}: no remote configured; local only`); return { ok: true }; }
    if (o.commitOnly) return { ok: true, offline: true };
    const f = await ui.spin(`${label}: fetching…`, () => git.gitA(["fetch", "-q", "--prune", "origin"], repo, { check: false, timeout }));
    if (f.code !== 0) { ui.warn(`${label}: offline or fetch timed out; will push later`); markSync("offline"); return { ok: true, offline: true }; }
    const branch = git.currentBranch(repo); if (!branch) { ui.fail(`${label}: detached HEAD; refusing to sync`); return { ok: false }; }
    if (!git.out(["rev-parse", "--abbrev-ref", "@{upstream}"], repo)) {
      if (git.out(["rev-parse", "--verify", "-q", `origin/${branch}`], repo)) git.git(["branch", "-q", `--set-upstream-to=origin/${branch}`, branch], repo);
      else if (!o.pullOnly) { await ui.spin(`${label}: pushing…`, () => git.gitA(["push", "-q", "-u", "origin", branch], repo, { timeout })); ui.ok(`${label}: pushed new branch ${branch}`); return { ok: true, pushed: 1 }; }
      else return { ok: true };
    }
    let [ahead, behind] = git.aheadBehind(repo) ?? [0, 0];
    if (behind && !o.pushOnly) {
      if (!ahead) { git.git(["merge", "-q", "--ff-only", "@{upstream}"], repo); ui.step(`${label}: fast-forwarded ${behind} commit(s)`); }
      else {
        const local = git.out(["rev-parse", "HEAD"], repo), upstream = git.out(["rev-parse", "@{upstream}"], repo);
        const r = git.git([...git.identityArgs(repo), "rebase", "-q", "@{upstream}"], repo, { check: false, env: { GIT_EDITOR: "true" } });
        if (r.code !== 0) {
          let open: Conflict[] | undefined;
          try { open = settleRebase(repo, label, local, upstream, o); } catch (e: any) { ui.error(`${label}: could not settle the rebase`, e.message.replace(/^cs: /, "")); return { ok: false }; }
          if (open) { ui.step(`${label}: ${open.length} file(s) changed on both machines — asking`); return { ok: false, conflicts: open }; }
        }
        ui.step(`${label}: rebased ${ahead} local commit(s) onto ${behind} remote commit(s)`);
      }
    }
    let pushed = 0;
    if (!o.pullOnly) { const ab = git.aheadBehind(repo); if (ab && ab[0]) { const pr = await ui.spin(`${label}: pushing…`, () => git.gitA(["push", "-q", "origin", branch], repo, { check: false, timeout }));
      if (pr.code !== 0) { ui.warn(`${label}: push rejected, retrying once`); release(); return shareGitSync(repo, label, machine, o); } pushed = ab[0]; ui.ok(`${label}: pushed ${ab[0]} commit(s)`); } }
    markSync(new Date().toISOString());
    return { ok: true, pushed };
  } finally { release(); }
}
/** The hidden `cs share-sync` (hooks, timer): cannot ask, so conflicts are settled newest-wins per file unless --resolve says otherwise. */
export async function runShareSync(repo: string, m: Machine, man: Manifest, o: SyncOpts & { debounce?: number } = {}): Promise<number> {
  const ws = workspace(man, m); let rc = 0;
  if (o.debounce && existsSync(lastSyncFile()) && Date.now() - statSync(lastSyncFile()).mtimeMs < o.debounce * 1000) return 0;
  const before = git.out(["rev-parse", "HEAD"], repo);
  if (!o.pullOnly) for (const p of selectedProjects(man, m)) if (checkouts(p, ws).length) syncProject(repo, p, ws);
  if (!(await shareGitSync(repo, "share", m.name, { ...o, resolve: o.resolve ?? "newest", ask: false })).ok) rc = 2;
  const after = git.out(["rev-parse", "HEAD"], repo);
  if (after !== before || o.pullOnly) {
    const changed = before ? git.out(["diff", "--name-only", before, after], repo) : "";
    if (o.pullOnly || changed.split("\n").some((x) => x.startsWith("claude/") || x.startsWith("projects.toml") || x.startsWith("plans/"))) runApply(repo, m, man);
    runLink(repo, m, loadManifest(repo));
  }
  return rc;
}
