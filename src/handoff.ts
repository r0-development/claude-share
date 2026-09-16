/** Handoffs: uncommitted work (and local-only commits) travel as one commit on <REF_NS>/<user>/<branch-slug> of the
 *  project's remote. cs sync sends and applies them; cs handoff / cs resume / cs handoffs / cs note are the manual halves.
 *
 *  The user's index, stash and working tree are never touched on the sending side: the handoff is built with a
 *  private GIT_INDEX_FILE. On the receiving side the handoff is applied as uncommitted changes and deleted.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { userInfo } from "node:os";
import * as git from "./git.js";
import { contract, handoffStateDir } from "./paths.js";
import type { Machine } from "./machine.js";
import { checkoutRoot, container, globMatch, projectForPath, selectedProjects, workspace, type Manifest, type Project } from "./manifest.js";
import { checkouts, runLink } from "./link.js";
import { pickNote, type Note, type NoteSource } from "./note.js";
import * as ui from "./ui.js";

const DENY = ["**/.env", "**/.env.*", "**/*.pem", "**/*.key", "**/*token*", "**/*secret*"];
const SIDE = ".cs-handoff";
const NOTE_LABEL: Record<NoteSource, string> = { explicit: " · note", claude: " · note (claude)", git: " · note (git-derived)" };
/** Remote ref namespace handoffs live under (an on-disk name: docs/MIGRATION.md lists the moves when it changes). */
export const REF_NS = "handoff";

export interface Handoff { ref: string; sha: string; branch: string; base: string; machine: string; worktree: string; note: string; when: string }
export interface Unit { path: string; branch: string; rel: string }

export const userSlug = (p: string) => git.slug(git.configGet(p, "user.name") || userInfo().username);
const handoffRef = (user: string, branch: string) => `${REF_NS}/${user}/${git.slug(branch)}`;
const refspec = (user: string) => `+refs/heads/${REF_NS}/${user}/*:refs/remotes/origin/${REF_NS}/${user}/*`;
const hoff = (p: Project): Record<string, any> => (p.handoff ?? {}) as Record<string, any>;
export const enabled = (p: Project) => (p.handoff as any) !== false && hoff(p).enabled !== false;

export function units(p: Project, ws: string): Unit[] {
  const cont = container(p, ws);
  return checkouts(p, ws).filter((c) => git.isRepo(c) || existsSync(join(c, ".git"))).map((c) => ({ path: c, branch: git.currentBranch(c), rel: relative(cont, c) || "." }));
}
export function denyHits(unit: string, p: Project, allow: string[]): string[] {
  const changed = [...git.out(["ls-files", "-o", "--exclude-standard"], unit).split("\n"), ...git.out(["diff", "--name-only", "HEAD"], unit).split("\n")].filter(Boolean);
  const pats = [...DENY, ...((hoff(p).never as string[]) ?? [])];
  return changed.filter((f) => pats.some((g) => globMatch(g, f) || globMatch(g, basename(f))) && !allow.some((g) => globMatch(g, f)));
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
async function backupAndReset(p: Project, m: Machine, ws: string, path: string, label: string): Promise<string> {
  const branch = git.currentBranch(path) || "detached";
  const snap = await buildSnapshot({ path, branch, rel: relative(container(p, ws), path) || "." }, p, m, "", [], []);
  const ref = backupRef(path, branch, snap.sha);
  git.git(["reset", "-q", "--hard"], path); git.git(["clean", "-qfd"], path); ui.step(`${label}: local changes backed up to ${ref}`);
  return ref;
}

const stateFile = (p: Project) => join(handoffStateDir(), `${p.name}.json`);
const noteFile = (p: Project) => join(handoffStateDir(), `${p.name}.note`);
function saveState(p: Project, data: unknown) { mkdirSync(handoffStateDir(), { recursive: true }); writeFileSync(stateFile(p), JSON.stringify(data, null, 2)); }
export function loadState(p: Project): any { try { return JSON.parse(readFileSync(stateFile(p), "utf8")); } catch { return undefined; } }

/** `branches` limits the run to those units (cs sync sends what the plan screen confirmed); `onDone` is called per handoff that reached the remote. */
export async function handoff(repo: string, m: Machine, man: Manifest, projects: Project[], o: { note?: string; dryRun?: boolean; allow?: string[]; overwrite?: boolean; branches?: string[]; onDone?: (project: string, branch: string) => void }): Promise<number> {
  const ws = workspace(man, m); let rc = 0; let pushed = 0;
  for (const p of projects) {
    if (!enabled(p)) { ui.skip(`${p.name}: handoff disabled`); continue; }
    const root = checkoutRoot(p, ws); if (!existsSync(root)) continue;
    const results: any[] = [];
    for (const u of units(p, ws)) {
      const label = `${p.name}${u.rel === "." ? "" : "/" + u.rel}`;
      if (o.branches && !o.branches.includes(u.branch)) continue;
      if (!u.branch || u.branch.startsWith(`${REF_NS}/`)) { ui.skip(`${label}: detached or on a handoff ref`); continue; }
      if (!git.remoteUrl(u.path)) { ui.skip(`${label}: no origin`); continue; }
      const ab = git.aheadBehind(u.path); const dirty = git.isDirty(u.path);
      if (!dirty && !(ab && ab[0])) { ui.skip(`${label}: clean`); continue; }
      const hits = denyHits(u.path, p, o.allow ?? []);
      if (hits.length) { ui.fail(`${label}: refusing to hand off files that look secret: ${hits.join(", ")}  (--allow <glob> to override)`); rc = 1; continue; }
      const user = userSlug(u.path); const ref = handoffRef(user, u.branch);
      if (o.dryRun) { ui.step(`${label}: would push ${git.dirtyCount(u.path)} change(s) on ${u.branch} → ${ref}`); continue; }
      await ui.spin(`${label}: fetching ${ref}…`, () => git.gitA(["fetch", "-q", "--prune", "origin", refspec(user)], u.path, { check: false, timeout: 60 }));
      const lease = git.out(["rev-parse", "--verify", "-q", `refs/remotes/origin/${ref}`], u.path);
      let earlier: (Note & { at: string }) | undefined;   // my own handoff being replaced: its note and where that note came from
      if (lease) { const t = git.trailers(u.path, lease);
        if (t["Cs-Machine"] && t["Cs-Machine"] !== m.name && !o.overwrite) { ui.fail(`${label}: a handoff from ${t["Cs-Machine"]} is waiting on ${ref} — run cs resume there first, or --overwrite`); rc = 1; continue; }
        if (t["Cs-Machine"] === m.name) { let mf: any = {}; try { mf = JSON.parse(git.out(["show", `${lease}:${SIDE}/manifest.json`], u.path)); } catch {}
          earlier = { note: git.out(["show", `${lease}:${SIDE}/NOTE.md`], u.path), source: mf.noteSource ?? "explicit", at: mf.at ?? "" }; } }   // handoffs from before generation: every note was typed
      const { note, source } = await ui.spin(`${label}: writing the note…`, () => pickNote(u, p, ws, o.note, earlier));
      const { sha, files } = await ui.spin(`${label}: snapshotting…`, () => buildSnapshot(u, p, m, note, (hoff(p).extra as string[]) ?? [], (hoff(p).exclude as string[]) ?? [], source));
      git.git(["update-ref", `refs/heads/${ref}`, sha], u.path);
      const push = await ui.spin(`${label}: pushing ${ref}…`, () => git.gitA(["push", "-q", `--force-with-lease=refs/heads/${ref}:${lease || ""}`, "origin", `refs/heads/${ref}:refs/heads/${ref}`], u.path, { check: false, timeout: 120 }));
      if (push.code !== 0) { ui.fail(`${label}: push rejected — ${push.err.split("\n").pop()}`); rc = 1; continue; }
      git.git(["update-ref", "-d", `refs/heads/${ref}`], u.path, { check: false });
      results.push({ ref, sha, branch: u.branch, worktree: u.rel, at: new Date().toISOString() }); pushed++; o.onDone?.(p.name, u.branch);
      ui.step(`${label}: ${u.branch} → ${ref}  ${ui.dim(`${files} file(s)${ab && ab[0] ? ` + ${ab[0]} unpushed commit(s)` : ""}${NOTE_LABEL[source]}`)}`);
    }
    if (results.length) saveState(p, { handedOff: results, machine: m.name });
  }
  return rc;
}

/** Fetch the handoff refs of `user` from origin and describe what is waiting. `ok` is false when the fetch failed (offline);
 *  `fetch: false` only reads what the last fetch brought. */
export async function fetchHandoffs(root: string, user: string, timeout = 60, fetch = true): Promise<{ ok: boolean; list: Handoff[] }> {
  const r = fetch ? await git.gitA(["fetch", "-q", "--prune", "origin", refspec(user)], root, { check: false, timeout }) : { code: 0 };
  const refs = git.out(["for-each-ref", "--format=%(refname:short) %(objectname)", `refs/remotes/origin/${REF_NS}/${user}/`], root).split("\n").filter(Boolean);
  const list = refs.map((l) => { const [full, sha] = l.split(" "); const t = git.trailers(root, sha); const ref = full.replace(/^origin\//, "");
    return { ref, sha, branch: t["Cs-Branch"] ?? "", base: t["Cs-Base"] ?? "", machine: t["Cs-Machine"] ?? "?", worktree: t["Cs-Worktree"] ?? ".", note: t["Cs-Note"] ?? "", when: git.out(["log", "-1", "--format=%cI", sha], root) }; }).filter((x) => x.branch);
  return { ok: r.code === 0, list };
}
const fetchWaiting = async (root: string, user: string) => (await fetchHandoffs(root, user)).list;

async function findOrCreateUnit(p: Project, m: Machine, ws: string, handoff: Handoff, replace: boolean): Promise<{ path: string; created: boolean } | undefined> {
  const root = checkoutRoot(p, ws);
  const existing = units(p, ws).find((u) => u.branch === handoff.branch); if (existing) return { path: existing.path, created: false };
  if (p.layout === "worktrees") {
    const dir = join(container(p, ws), `wt-${git.slug(handoff.branch)}`);
    const hasBranch = !!git.out(["rev-parse", "--verify", "-q", `refs/heads/${handoff.branch}`], root);
    const r = git.git(["worktree", "add", "-q", ...(hasBranch ? [dir, handoff.branch] : ["-b", handoff.branch, dir, handoff.base])], root, { check: false });
    if (r.code !== 0) { ui.fail(`${p.name}: could not create worktree ${contract(dir)} — ${r.err.split("\n").pop()}`); return undefined; }
    return { path: dir, created: true };
  }
  if (git.isDirty(root)) {   // plain layout: the root must be clean before another branch can be checked out
    if (!replace) { ui.fail(`${p.name}: ${contract(root)} is dirty and on ${git.currentBranch(root)}; commit/stash or use --replace`); return undefined; }
    await backupAndReset(p, m, ws, root, `${p.name} · ${git.currentBranch(root)}`);
  }
  const r = git.git(["checkout", "-q", "-B", handoff.branch, git.out(["rev-parse", "--verify", "-q", `refs/heads/${handoff.branch}`], root) || handoff.base], root, { check: false });
  if (r.code !== 0) { ui.fail(`${p.name}: checkout ${handoff.branch} failed — ${r.err.split("\n").pop()}`); return undefined; }
  return { path: root, created: false };
}

/** `branches` limits the run to those handoffs; `waiting` skips the fetch when the caller (cs sync) already has the list;
 *  `onNote` receives each handoff note instead of it being printed here (cs sync prints them after its spinner); `onDone` is called per handoff applied. */
export async function resume(repo: string, m: Machine, man: Manifest, projects: Project[], o: { replace?: boolean; keepRemote?: boolean; dryRun?: boolean; branches?: string[]; waiting?: Record<string, Handoff[]>; onNote?: (project: string, from: string, note: string) => void; onDone?: (project: string, branch: string) => void }): Promise<number> {
  const ws = workspace(man, m); let rc = 0;
  for (const p of projects) {
    if (!enabled(p)) continue;
    const root = checkoutRoot(p, ws); if (!existsSync(root) || !git.remoteUrl(root)) continue;
    const user = userSlug(root);
    const handoffs = o.waiting?.[p.name] ?? (await ui.spin(`${p.name}: looking for handoffs…`, () => fetchWaiting(root, user)));
    if (!handoffs.length) { ui.skip(`${p.name}: nothing to resume`); continue; }
    for (const pc of handoffs) {
      if (o.branches && !o.branches.includes(pc.branch)) continue;
      const label = `${p.name} · ${pc.branch}`;
      if (o.dryRun) { ui.step(`${label}: handoff from ${pc.machine} (${pc.when.slice(0, 16)})${pc.note ? " — " + pc.note : ""}`); continue; }
      const unit = await findOrCreateUnit(p, m, ws, pc, !!o.replace); if (!unit) { rc = 1; continue; }
      if (git.isDirty(unit.path)) {
        if (!o.replace) { ui.fail(`${label}: ${contract(unit.path)} has uncommitted changes — commit them, or --replace (keeps a backup ref)`); rc = 1; continue; }
        await backupAndReset(p, m, ws, unit.path, label);
      }
      const ff = git.git(["merge", "-q", "--ff-only", pc.base], unit.path, { check: false });
      if (ff.code !== 0) { ui.fail(`${label}: branch diverged from the handoff's base ${pc.base.slice(0, 7)} — merge/rebase manually, then re-run`); rc = 1; continue; }
      const cp = git.git(["cherry-pick", "-n", "--allow-empty", pc.sha], unit.path, { check: false });
      if (cp.code !== 0) { git.git(["cherry-pick", "--abort"], unit.path, { check: false }); git.git(["reset", "-q", "--hard"], unit.path); ui.fail(`${label}: could not apply handoff — ${cp.err.split("\n").pop()}`); rc = 1; continue; }
      git.git(["reset", "-q"], unit.path);
      let extras: string[] = []; try { extras = JSON.parse(readFileSync(join(unit.path, SIDE, "manifest.json"), "utf8")).extras ?? []; } catch {}
      for (const e of extras) git.git(["rm", "-rq", "--cached", "--", e], unit.path, { check: false });
      let note = ""; try { note = readFileSync(join(unit.path, SIDE, "NOTE.md"), "utf8"); } catch {}
      rmSync(join(unit.path, SIDE), { recursive: true, force: true });
      const wasQuiet = ui.isQuiet(); ui.setQuiet(true); try { runLink(repo, m, man, [p.name]); } finally { ui.setQuiet(wasQuiet); }
      if (!o.keepRemote) { await ui.spin(`${label}: removing ${pc.ref} from origin…`, () => git.gitA(["push", "-q", "origin", "--delete", pc.ref], unit.path, { check: false, timeout: 60 })); git.git(["update-ref", "-d", `refs/remotes/origin/${pc.ref}`], unit.path, { check: false }); }
      if (note) { mkdirSync(handoffStateDir(), { recursive: true }); writeFileSync(noteFile(p), note); }
      saveState(p, { resumed: { branch: pc.branch, from: pc.machine, at: new Date().toISOString(), path: unit.path } }); o.onDone?.(p.name, pc.branch);
      ui.step(`${label}: restored in ${contract(unit.path)}${unit.created ? ui.dim(" (worktree created)") : ""}  ${ui.dim(`${git.dirtyCount(unit.path)} change(s) from ${pc.machine}`)}`);
      if (note) o.onNote ? o.onNote(p.name, pc.machine, note) : ui.note(note.trim().split("\n"), `note from ${pc.machine}`);
    }
  }
  return rc;
}

export async function waitingList(m: Machine, man: Manifest, projects: Project[]): Promise<Handoff[]> {
  const ws = workspace(man, m); const all: Handoff[] = [];
  for (const p of projects) { const root = checkoutRoot(p, ws); if (!existsSync(root) || !git.remoteUrl(root) || !enabled(p)) continue;
    const handoffs = await ui.spin(`${p.name}: fetching handoffs…`, () => fetchWaiting(root, userSlug(root)));
    for (const pc of handoffs) all.push({ ...pc, ref: pc.ref, worktree: p.name });
  }
  return all;
}
export async function handoffGc(m: Machine, man: Manifest, projects: Project[], olderThanDays: number): Promise<number> {
  const ws = workspace(man, m); let n = 0;
  for (const p of projects) { const root = checkoutRoot(p, ws); if (!existsSync(root) || !git.remoteUrl(root)) continue;
    for (const pc of await fetchWaiting(root, userSlug(root))) { const age = (Date.now() - Date.parse(pc.when)) / 86400000; if (age < olderThanDays) continue;
      await git.gitA(["push", "-q", "origin", "--delete", pc.ref], root, { check: false }); ui.step(`${p.name}: dropped ${pc.ref} (${Math.floor(age)} days old)`); n++; } }
  return n;
}
export async function handoffDrop(m: Machine, man: Manifest, p: Project, ref: string): Promise<void> {
  const root = checkoutRoot(p, workspace(man, m)); const full = ref.startsWith(`${REF_NS}/`) ? ref : handoffRef(userSlug(root), ref);
  await ui.spin(`removing ${full}…`, () => git.gitA(["push", "-q", "origin", "--delete", full], root, { timeout: 60 })); ui.ok(`dropped ${full}`);
}

/** Print (and forget) the note left by the last resume for the cwd's project. */
export function printNote(man: Manifest, m: Machine, cwd = process.cwd()): boolean {
  const p = projectForPath(man, m, cwd); if (!p) return false;
  const f = noteFile(p); if (!existsSync(f)) return false;
  const note = readFileSync(f, "utf8"); rmSync(f, { force: true });
  const st = loadState(p);
  process.stdout.write(`Handoff note for ${p.name}${st?.resumed?.from ? ` (from ${st.resumed.from}, resumed ${st.resumed.at?.slice(0, 16)})` : ""}:\n${note.trimEnd()}\n`);
  return true;
}
export const projectsFor = (man: Manifest, m: Machine, names: string[], all: boolean): Project[] => {
  if (names.length) return names.map((n) => { const p = man.projects[n]; if (!p) throw new Error(`cs: unknown project '${n}'`); return p; });
  if (all) return selectedProjects(man, m);
  const p = projectForPath(man, m, process.cwd()); if (!p) throw new Error("cs: not inside a registered project (pass a name or --all)"); return [p];
};
