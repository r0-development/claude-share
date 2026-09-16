/** A project's checkout on this machine: where it is (the layout rule lives here and nowhere else), whether it is one at all
 *  (a git repo with a remote — anything else is an absence cs doctor reports, ADR-0001), its units and their facts, and
 *  the verbs that move work between machines: send, apply, push.
 *
 *  Handoffs: uncommitted work (and local-only commits) travel as one commit on <REF_NS>/<user>/<branch-slug> of the
 *  project's remote. The user's index, stash and working tree are never touched on the sending side: the handoff is built
 *  with a private GIT_INDEX_FILE. On the receiving side it is applied as uncommitted changes and deleted from the remote.
 *  The verbs trust the facts the plan decided on (ADR-0004) and re-check only the secret-file guard; the losing side of
 *  any overwrite goes to a refs/cs/backup/… ref first, never away. Outcome lines are printed here, once, for every caller. */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { userInfo } from "node:os";
import * as git from "./git.js";
import { contract, handoffStateDir } from "./paths.js";
import type { Machine } from "./machine.js";
import { globMatch, type Project } from "./manifest.js";
import { pickNote, type Note, type NoteSource } from "./note.js";
import * as ui from "./ui.js";

const DENY = ["**/.env", "**/.env.*", "**/*.pem", "**/*.key", "**/*token*", "**/*secret*"];
const SIDE = ".cs-handoff";
const NOTE_LABEL: Record<NoteSource, string> = { explicit: " · note", claude: " · note (claude)", git: " · note (git-derived)" };
/** Remote ref namespace handoffs live under (an on-disk name: docs/MIGRATION.md lists the moves when it changes). */
export const REF_NS = "handoff";

/** One directory of a checkout — the root or one worktree — on one branch. `branch` is "" when detached. `skip` says why
 *  a handoff cannot carry it; `secrets` names dirty files that look secret (only computed when dirty and not skipped). */
export interface Unit { path: string; rel: string; branch: string; dirty: number; unpushed: number; skip?: string; secrets?: string[] }
export interface Checkout { project: Project; root: string; container: string; units: Unit[] }
export interface Absence { project: Project; root: string; why: "missing" | "not a git repo" | "no remote" }
/** A handoff waiting on the project's remote, as its commit trailers describe it. */
export interface Handoff { ref: string; sha: string; branch: string; base: string; machine: string; worktree: string; note: string; when: string }

/** The project's directory under the workspace; the worktrees layout keeps the repo itself in `repo` under it. */
export const container = (p: Project, ws: string) => join(ws, p.path || p.name);
export const checkoutRoot = (p: Project, ws: string) => (p.layout === "worktrees" ? join(container(p, ws), "repo") : container(p, ws));

/** The layout of a directory that is not (or no longer) in the manifest: a repo under `repo` means worktrees. */
export const sniff = (dir: string): { root: string; layout: Project["layout"] } => (existsSync(join(dir, "repo", ".git")) ? { root: join(dir, "repo"), layout: "worktrees" } : { root: dir, layout: "plain" });
const hoff = (p: Project): Record<string, any> => (p.handoff ?? {}) as Record<string, any>;
export const enabled = (p: Project) => (p.handoff as any) !== false && hoff(p).enabled !== false;
/** Dirty files of a unit that look secret (the deny list plus the project's `handoff.never`), minus `allow` globs. */
export function denyHits(unit: string, p: Project, allow: string[]): string[] {
  const changed = [...git.out(["ls-files", "-o", "--exclude-standard"], unit).split("\n"), ...git.out(["diff", "--name-only", "HEAD"], unit).split("\n")].filter(Boolean);
  const pats = [...DENY, ...((hoff(p).never as string[]) ?? [])];
  return changed.filter((f) => pats.some((g) => globMatch(g, f) || globMatch(g, basename(f))) && !allow.some((g) => globMatch(g, f)));
}

/** The directories of a checkout, cheaply (no git status): project-state placement writes into these. A directory that is
 *  not a repo yet is still a place to write into; a missing one is nothing. */
export const dirsAt = (root: string): string[] => (!existsSync(root) ? [] : !git.isRepo(root) ? [root] : git.worktrees(root).length ? git.worktrees(root) : [root]);
export const dirs = (p: Project, ws: string): string[] => dirsAt(checkoutRoot(p, ws));

export const present = (c: Checkout | Absence): c is Checkout => "units" in c;
/** The project's checkout here with its units observed — or why there is none. `allow` globs exempt files from the
 *  secret-file guard (cs handoff --allow). */
export function locate(p: Project, ws: string, o: { allow?: string[] } = {}): Checkout | Absence {
  const root = checkoutRoot(p, ws), cont = container(p, ws);
  if (!existsSync(root)) return { project: p, root, why: "missing" };
  if (!git.isRepo(root)) return { project: p, root, why: "not a git repo" };
  if (!git.remoteUrl(root)) return { project: p, root, why: "no remote" };
  const units = dirsAt(root).filter((d) => git.isRepo(d)).map((path): Unit => {
    const branch = git.currentBranch(path); const dirty = git.dirtyCount(path); const unpushed = git.aheadBehind(path)?.[0] ?? 0;
    const skip = !branch ? "detached HEAD" : branch.startsWith(`${REF_NS}/`) ? "on a handoff ref" : undefined;
    return { path, rel: relative(cont, path) || ".", branch, dirty, unpushed, ...(skip ? { skip } : {}), ...(dirty && !skip ? { secrets: denyHits(path, p, o.allow ?? []) } : {}) };
  });
  return { project: p, root, container: cont, units };
}

// ---------------------------------------------------------------- handoff refs on the remote
export const userSlug = (p: string) => git.slug(git.configGet(p, "user.name") || userInfo().username);
export const handoffRef = (user: string, branch: string) => `${REF_NS}/${user}/${git.slug(branch)}`;
const refspec = (user: string) => `+refs/heads/${REF_NS}/${user}/*:refs/remotes/origin/${REF_NS}/${user}/*`;
const stateFile = (p: Project) => join(handoffStateDir(), `${p.name}.json`);
export const noteFile = (p: Project) => join(handoffStateDir(), `${p.name}.note`);
function saveState(p: Project, data: unknown) { mkdirSync(handoffStateDir(), { recursive: true }); writeFileSync(stateFile(p), JSON.stringify(data, null, 2)); }
export function loadState(p: Project): any { try { return JSON.parse(readFileSync(stateFile(p), "utf8")); } catch { return undefined; } }

/** Fetch this user's handoff refs from origin and describe what is waiting. `ok` is false when the fetch failed (offline);
 *  `fetch: false` only reads what the last fetch brought. */
export async function fetchWaiting(c: Checkout, o: { timeout?: number; fetch?: boolean } = {}): Promise<{ ok: boolean; list: Handoff[] }> {
  const user = userSlug(c.root);
  const r = o.fetch !== false ? await git.gitA(["fetch", "-q", "--prune", "origin", refspec(user)], c.root, { check: false, timeout: o.timeout ?? 60 }) : { code: 0 };
  const refs = git.out(["for-each-ref", "--format=%(refname:short) %(objectname)", `refs/remotes/origin/${REF_NS}/${user}/`], c.root).split("\n").filter(Boolean);
  const list = refs.map((l) => { const [full, sha] = l.split(" "); const t = git.trailers(c.root, sha); const ref = full.replace(/^origin\//, "");
    return { ref, sha, branch: t["Cs-Branch"] ?? "", base: t["Cs-Base"] ?? "", machine: t["Cs-Machine"] ?? "?", worktree: t["Cs-Worktree"] ?? ".", note: t["Cs-Note"] ?? "", when: git.out(["log", "-1", "--format=%cI", sha], c.root) }; }).filter((x) => x.branch);
  return { ok: r.code === 0, list };
}

/** Build a commit of the whole working tree (tracked + untracked, .gitignore respected) without touching the user's index. */
async function buildSnapshot(unit: Unit, p: Project, m: Machine, note: string, extras: string[], excludes: string[], noteSource?: NoteSource): Promise<{ sha: string; files: number }> {
  const idx = join(git.commonDir(unit.path), `cs-handoff-index-${process.pid}`);
  const env = { GIT_INDEX_FILE: idx };
  try {
    git.git(["read-tree", "HEAD"], unit.path, { env });
    git.git(["add", "-A", "--", ".", ...excludes.map((e) => `:!${e}`)], unit.path, { env });
    const added: string[] = [];
    for (const g of extras) { const r = git.git(["add", "-f", "--", g], unit.path, { env, check: false }); if (r.code === 0) added.push(g); }
    const putFile = (rel: string, content: string) => { const blob = git.git(["hash-object", "-w", "--stdin"], unit.path, { input: content }).out; git.git(["update-index", "--add", "--cacheinfo", `100644,${blob},${rel}`], unit.path, { env }); };
    putFile(`${SIDE}/manifest.json`, JSON.stringify({ extras: added, machine: m.name, at: new Date().toISOString(), ...(note ? { noteSource } : {}) }, null, 2) + "\n");
    if (note) putFile(`${SIDE}/NOTE.md`, note.trimEnd() + "\n");
    const tree = git.git(["write-tree"], unit.path, { env }).out;
    const files = git.out(["diff-tree", "-r", "--name-only", "HEAD", tree], unit.path).split("\n").filter((f) => f && !f.startsWith(SIDE)).length;
    const head = git.out(["rev-parse", "HEAD"], unit.path);
    const msg = [`handoff(${m.name}): ${unit.branch} @ ${head.slice(0, 7)} ${new Date().toISOString()}`, "",
      `Cs-Base: ${head}`, `Cs-Branch: ${unit.branch}`, `Cs-Machine: ${m.name}`, `Cs-Worktree: ${unit.rel}`, ...(note ? [`Cs-Note: ${note.split("\n")[0].slice(0, 120)}`] : [])].join("\n");
    const sha = git.git(["commit-tree", tree, "-p", head, "-m", msg], unit.path, { env: { ...env, GIT_AUTHOR_NAME: git.configGet(unit.path, "user.name") || "cs", GIT_AUTHOR_EMAIL: git.configGet(unit.path, "user.email") || "cs@localhost", GIT_COMMITTER_NAME: git.configGet(unit.path, "user.name") || "cs", GIT_COMMITTER_EMAIL: git.configGet(unit.path, "user.email") || "cs@localhost" } }).out;
    return { sha, files };
  } finally { rmSync(idx, { force: true }); }
}

/** The losing side of a conflict is never lost: keep a commit under refs/cs/backup/<branch>/<time> of the unit. */
export function backupRef(unit: string, branch: string, sha: string): string { const ref = `refs/cs/backup/${git.slug(branch)}/${Date.now()}`; git.git(["update-ref", ref, sha], unit); return ref; }
/** Snapshot a unit's uncommitted work to a backup ref, then reset the tree so a handoff can be applied. */
async function backupAndReset(c: Checkout, m: Machine, path: string, label: string): Promise<string> {
  const branch = git.currentBranch(path) || "detached";
  const snap = await buildSnapshot({ path, branch, rel: relative(c.container, path) || ".", dirty: 0, unpushed: 0 }, c.project, m, "", [], []);
  const ref = backupRef(path, branch, snap.sha);
  git.git(["reset", "-q", "--hard"], path); git.git(["clean", "-qfd"], path); ui.step(`${label}: local changes backed up to ${ref}`);
  return ref;
}

export type SendResult = { ok: true; ref: string; files: number; unpushed: number } | { ok: false };
/** Send a unit's work to its handoff ref. Trusts the plan's facts; re-checks only the secret-file guard (`allow` globs
 *  override it). `over` is the other machine's handoff the plan decided to replace: backed up to a ref here first. A handoff
 *  from another machine that appeared on the ref since the plan is refused (the lease). */
export async function send(c: Checkout, u: Unit, m: Machine, o: { note?: string; allow?: string[]; over?: Handoff; dryRun?: boolean } = {}): Promise<SendResult> {
  const p = c.project; const label = `${p.name}${u.rel === "." ? "" : "/" + u.rel}`;
  const hits = denyHits(u.path, p, o.allow ?? []);
  if (hits.length) { ui.fail(`${label}: refusing to hand off files that look secret: ${hits.join(", ")}  (--allow <glob> to override)`); return { ok: false }; }
  const user = userSlug(u.path); const ref = handoffRef(user, u.branch);
  if (o.dryRun) { ui.step(`${label}: would push ${git.dirtyCount(u.path)} change(s) on ${u.branch} → ${ref}`); return { ok: false }; }
  await ui.spin(`${label}: fetching ${ref}…`, () => git.gitA(["fetch", "-q", "--prune", "origin", refspec(user)], u.path, { check: false, timeout: 60 }));
  const lease = git.out(["rev-parse", "--verify", "-q", `refs/remotes/origin/${ref}`], u.path);
  let earlier: (Note & { at: string }) | undefined;   // my own handoff being replaced: its note and where that note came from
  if (lease) { const t = git.trailers(u.path, lease);
    if (t["Cs-Machine"] && t["Cs-Machine"] !== m.name) {
      if (!o.over || o.over.sha !== lease) { ui.fail(`${label}: a handoff from ${t["Cs-Machine"]} is waiting on ${ref} — run cs resume there first, or --overwrite`); return { ok: false }; }
      ui.step(`${p.name} · ${u.branch}: handoff from ${o.over.machine} backed up to ${backupRef(u.path, u.branch, o.over.sha)}`);
    }
    if (t["Cs-Machine"] === m.name) { let mf: any = {}; try { mf = JSON.parse(git.out(["show", `${lease}:${SIDE}/manifest.json`], u.path)); } catch {}
      earlier = { note: git.out(["show", `${lease}:${SIDE}/NOTE.md`], u.path), source: mf.noteSource ?? "explicit", at: mf.at ?? "" }; } }   // handoffs from before generation: every note was typed
  const { note, source } = await ui.spin(`${label}: writing the note…`, () => pickNote(u, c, o.note, earlier));
  const { sha, files } = await ui.spin(`${label}: snapshotting…`, () => buildSnapshot(u, p, m, note, (hoff(p).extra as string[]) ?? [], (hoff(p).exclude as string[]) ?? [], source));
  git.git(["update-ref", `refs/heads/${ref}`, sha], u.path);
  const push = await ui.spin(`${label}: pushing ${ref}…`, () => git.gitA(["push", "-q", `--force-with-lease=refs/heads/${ref}:${lease || ""}`, "origin", `refs/heads/${ref}:refs/heads/${ref}`], u.path, { check: false, timeout: 120 }));
  git.git(["update-ref", "-d", `refs/heads/${ref}`], u.path, { check: false });
  if (push.code !== 0) { ui.fail(`${label}: push rejected — ${push.err.split("\n").pop()}`); return { ok: false }; }
  saveState(p, { handedOff: [{ ref, sha, branch: u.branch, worktree: u.rel, at: new Date().toISOString() }], machine: m.name });
  ui.step(`${label}: ${u.branch} → ${ref}  ${ui.dim(`${files} file(s)${u.unpushed ? ` + ${u.unpushed} unpushed commit(s)` : ""}${NOTE_LABEL[source]}`)}`);
  return { ok: true, ref, files, unpushed: u.unpushed };
}

/** The unit a handoff lands in: the branch's own unit, else (worktrees) a new worktree, else (plain) the root checked out
 *  onto the branch — which needs a clean root: `replace` backs its changes up first. */
async function landing(c: Checkout, m: Machine, h: Handoff, replace: boolean): Promise<{ path: string; created: boolean } | undefined> {
  const p = c.project, root = c.root;
  const existing = c.units.find((u) => u.branch === h.branch); if (existing) return { path: existing.path, created: false };
  if (p.layout === "worktrees") {
    const dir = join(c.container, `wt-${git.slug(h.branch)}`);
    const hasBranch = !!git.out(["rev-parse", "--verify", "-q", `refs/heads/${h.branch}`], root);
    const r = git.git(["worktree", "add", "-q", ...(hasBranch ? [dir, h.branch] : ["-b", h.branch, dir, h.base])], root, { check: false });
    if (r.code !== 0) { ui.fail(`${p.name}: could not create worktree ${contract(dir)} — ${r.err.split("\n").pop()}`); return undefined; }
    return { path: dir, created: true };
  }
  if (git.isDirty(root)) {
    if (!replace) { ui.fail(`${p.name}: ${contract(root)} is dirty and on ${git.currentBranch(root)}; commit/stash or use --replace`); return undefined; }
    await backupAndReset(c, m, root, `${p.name} · ${git.currentBranch(root)}`);
  }
  const r = git.git(["checkout", "-q", "-B", h.branch, git.out(["rev-parse", "--verify", "-q", `refs/heads/${h.branch}`], root) || h.base], root, { check: false });
  if (r.code !== 0) { ui.fail(`${p.name}: checkout ${h.branch} failed — ${r.err.split("\n").pop()}`); return undefined; }
  return { path: root, created: false };
}

export type ApplyResult = { ok: true; path: string; created: boolean; note: string } | { ok: false };
/** Apply a waiting handoff as uncommitted changes in its unit and remove it from the remote (`keepRemote` leaves it).
 *  `replace` backs the unit's own changes up to a ref and clears them first; without it a dirty unit is refused.
 *  The note comes back for the caller to show; project state placement into a new worktree is the caller's too. */
export async function apply(c: Checkout, h: Handoff, m: Machine, o: { replace?: boolean; keepRemote?: boolean; dryRun?: boolean } = {}): Promise<ApplyResult> {
  const p = c.project; const label = `${p.name} · ${h.branch}`;
  if (o.dryRun) { ui.step(`${label}: handoff from ${h.machine} (${h.when.slice(0, 16)})${h.note ? " — " + h.note : ""}`); return { ok: false }; }
  const unit = await landing(c, m, h, !!o.replace); if (!unit) return { ok: false };
  if (git.isDirty(unit.path)) {
    if (!o.replace) { ui.fail(`${label}: ${contract(unit.path)} has uncommitted changes — commit them, or --replace (keeps a backup ref)`); return { ok: false }; }
    await backupAndReset(c, m, unit.path, label);
  }
  const ff = git.git(["merge", "-q", "--ff-only", h.base], unit.path, { check: false });
  if (ff.code !== 0) { ui.fail(`${label}: branch diverged from the handoff's base ${h.base.slice(0, 7)} — merge/rebase manually, then re-run`); return { ok: false }; }
  const cp = git.git(["cherry-pick", "-n", "--allow-empty", h.sha], unit.path, { check: false });
  if (cp.code !== 0) { git.git(["cherry-pick", "--abort"], unit.path, { check: false }); git.git(["reset", "-q", "--hard"], unit.path); ui.fail(`${label}: could not apply handoff — ${cp.err.split("\n").pop()}`); return { ok: false }; }
  git.git(["reset", "-q"], unit.path);
  let extras: string[] = []; try { extras = JSON.parse(readFileSync(join(unit.path, SIDE, "manifest.json"), "utf8")).extras ?? []; } catch {}
  for (const e of extras) git.git(["rm", "-rq", "--cached", "--", e], unit.path, { check: false });
  let note = ""; try { note = readFileSync(join(unit.path, SIDE, "NOTE.md"), "utf8"); } catch {}
  rmSync(join(unit.path, SIDE), { recursive: true, force: true });
  if (!o.keepRemote) { await ui.spin(`${label}: removing ${h.ref} from origin…`, () => git.gitA(["push", "-q", "origin", "--delete", h.ref], unit.path, { check: false, timeout: 60 })); git.git(["update-ref", "-d", `refs/remotes/origin/${h.ref}`], unit.path, { check: false }); }
  if (note) { mkdirSync(handoffStateDir(), { recursive: true }); writeFileSync(noteFile(p), note); }
  saveState(p, { resumed: { branch: h.branch, from: h.machine, at: new Date().toISOString(), path: unit.path } });
  ui.step(`${label}: restored in ${contract(unit.path)}${unit.created ? ui.dim(" (worktree created)") : ""}  ${ui.dim(`${git.dirtyCount(unit.path)} change(s) from ${h.machine}`)}`);
  return { ok: true, path: unit.path, created: unit.created, note };
}

export type PushResult = { ok: true; to: string } | { ok: false };
/** Push a unit's real branch to its configured upstream, never forced. Only cs sync's plan screen reaches this (ADR-0002). */
export async function push(c: Checkout, u: Unit): Promise<PushResult> {
  const label = `${c.project.name} · ${u.branch}`; const up = git.upstream(u.path, u.branch);
  if (!up) { ui.fail(`${label}: no upstream configured — not pushed`); return { ok: false }; }
  const r = await ui.spin(`${label}: pushing…`, () => git.gitA(["push", "-q", up.remote, `refs/heads/${u.branch}:${up.ref}`], u.path, { check: false, timeout: 120 }));
  if (r.code !== 0) { ui.fail(`${label}: push rejected — ${r.err.split("\n").pop()}`); return { ok: false }; }
  const to = `${up.remote}/${up.ref.replace(/^refs\/heads\//, "")}`; ui.step(`${label} → ${to}`);
  return { ok: true, to };
}
