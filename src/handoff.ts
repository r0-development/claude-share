/** cs handoff / cs resume / cs wip / cs note — uncommitted work travels as a parcel commit on wip/<user>/<branch-slug>.
 *
 *  The user's index, stash and working tree are never touched on the sending side: the parcel is built with a
 *  private GIT_INDEX_FILE. On the receiving side the parcel is applied as uncommitted changes and deleted.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { userInfo } from "node:os";
import * as git from "./git.js";
import { contract, handoffStateDir } from "./paths.js";
import type { Machine } from "./config.js";
import { checkoutRoot, container, globMatch, projectForPath, selectedProjects, workspace, type Manifest, type Project } from "./manifest.js";
import { checkouts, runLink } from "./link.js";
import * as ui from "./ui.js";

const DENY = ["**/.env", "**/.env.*", "**/*.pem", "**/*.key", "**/*token*", "**/*secret*"];
const SIDE = ".cs-handoff";

interface Parcel { ref: string; sha: string; branch: string; base: string; machine: string; worktree: string; note: string; when: string }
interface Unit { path: string; branch: string; rel: string }

const userSlug = (p: string) => git.slug(git.configGet(p, "user.name") || userInfo().username);
const wipRef = (user: string, branch: string) => `wip/${user}/${git.slug(branch)}`;
const hoff = (p: Project): Record<string, any> => (p.handoff ?? {}) as Record<string, any>;
const enabled = (p: Project) => (p.handoff as any) !== false && hoff(p).enabled !== false;

function units(p: Project, ws: string): Unit[] {
  const cont = container(p, ws);
  return checkouts(p, ws).filter((c) => git.isRepo(c) || existsSync(join(c, ".git"))).map((c) => ({ path: c, branch: git.currentBranch(c), rel: relative(cont, c) || "." }));
}
function denyHits(unit: string, p: Project, allow: string[]): string[] {
  const changed = [...git.out(["ls-files", "-o", "--exclude-standard"], unit).split("\n"), ...git.out(["diff", "--name-only", "HEAD"], unit).split("\n")].filter(Boolean);
  const pats = [...DENY, ...((hoff(p).never as string[]) ?? [])];
  return changed.filter((f) => pats.some((g) => globMatch(g, f) || globMatch(g, basename(f))) && !allow.some((g) => globMatch(g, f)));
}

/** Build a commit of the whole working tree (tracked + untracked, .gitignore respected) without touching the user's index. */
async function buildParcel(unit: Unit, p: Project, m: Machine, note: string, extras: string[], excludes: string[]): Promise<{ sha: string; files: number }> {
  const idx = join(git.commonDir(unit.path), `cs-handoff-index-${process.pid}`);
  const env = { GIT_INDEX_FILE: idx };
  try {
    git.git(["read-tree", "HEAD"], unit.path, { env });
    git.git(["add", "-A", "--", ".", ...excludes.map((e) => `:!${e}`)], unit.path, { env });
    const added: string[] = [];
    for (const g of extras) { const r = git.git(["add", "-f", "--", g], unit.path, { env, check: false }); if (r.code === 0) added.push(g); }
    const putFile = (rel: string, content: string) => { const blob = git.git(["hash-object", "-w", "--stdin"], unit.path, { input: content }).out; git.git(["update-index", "--add", "--cacheinfo", `100644,${blob},${rel}`], unit.path, { env }); };
    putFile(`${SIDE}/manifest.json`, JSON.stringify({ extras: added, machine: m.name, at: new Date().toISOString() }, null, 2) + "\n");
    if (note) putFile(`${SIDE}/NOTE.md`, note.trimEnd() + "\n");
    const tree = git.git(["write-tree"], unit.path, { env }).out;
    const files = git.out(["diff-tree", "-r", "--name-only", "HEAD", tree], unit.path).split("\n").filter((f) => f && !f.startsWith(SIDE)).length;
    const head = git.out(["rev-parse", "HEAD"], unit.path);
    const msg = [`wip(${m.name}): ${unit.branch} @ ${head.slice(0, 7)} ${new Date().toISOString()}`, "",
      `Cs-Base: ${head}`, `Cs-Branch: ${unit.branch}`, `Cs-Machine: ${m.name}`, `Cs-Worktree: ${unit.rel}`, ...(note ? [`Cs-Note: ${note.split("\n")[0].slice(0, 120)}`] : [])].join("\n");
    const sha = git.git(["commit-tree", tree, "-p", head, "-m", msg], unit.path, { env: { ...env, GIT_AUTHOR_NAME: git.configGet(unit.path, "user.name") || "cs", GIT_AUTHOR_EMAIL: git.configGet(unit.path, "user.email") || "cs@localhost", GIT_COMMITTER_NAME: git.configGet(unit.path, "user.name") || "cs", GIT_COMMITTER_EMAIL: git.configGet(unit.path, "user.email") || "cs@localhost" } }).out;
    return { sha, files };
  } finally { rmSync(idx, { force: true }); }
}

const stateFile = (p: Project) => join(handoffStateDir(), `${p.name}.json`);
const noteFile = (p: Project) => join(handoffStateDir(), `${p.name}.note`);
export const pendingFile = () => join(handoffStateDir(), "pending");
function saveState(p: Project, data: unknown) { mkdirSync(handoffStateDir(), { recursive: true }); writeFileSync(stateFile(p), JSON.stringify(data, null, 2)); }
export function loadState(p: Project): any { try { return JSON.parse(readFileSync(stateFile(p), "utf8")); } catch { return undefined; } }

export async function handoff(repo: string, m: Machine, man: Manifest, projects: Project[], o: { note?: string; dryRun?: boolean; allow?: string[]; overwrite?: boolean }): Promise<number> {
  const ws = workspace(man, m); let rc = 0; let pushed = 0;
  for (const p of projects) {
    if (!enabled(p)) { ui.skip(`${p.name}: handoff disabled`); continue; }
    const root = checkoutRoot(p, ws); if (!existsSync(root)) continue;
    const results: any[] = [];
    for (const u of units(p, ws)) {
      const label = `${p.name}${u.rel === "." ? "" : "/" + u.rel}`;
      if (!u.branch || u.branch.startsWith("wip/")) { ui.skip(`${label}: detached or on a wip branch`); continue; }
      if (!git.remoteUrl(u.path)) { ui.skip(`${label}: no origin`); continue; }
      const ab = git.aheadBehind(u.path); const dirty = git.isDirty(u.path);
      if (!dirty && !(ab && ab[0])) { ui.skip(`${label}: clean`); continue; }
      const hits = denyHits(u.path, p, o.allow ?? []);
      if (hits.length) { ui.fail(`${label}: refusing to hand off files that look secret: ${hits.join(", ")}  (--allow <glob> to override)`); rc = 1; continue; }
      const user = userSlug(u.path); const ref = wipRef(user, u.branch);
      if (o.dryRun) { ui.step(`${label}: would push ${git.dirtyCount(u.path)} change(s) on ${u.branch} → ${ref}`); continue; }
      await ui.spin(`${label}: fetching ${ref}…`, () => git.gitA(["fetch", "-q", "--prune", "origin", `+refs/heads/wip/${user}/*:refs/remotes/origin/wip/${user}/*`], u.path, { check: false, timeout: 60 }));
      const lease = git.out(["rev-parse", "--verify", "-q", `refs/remotes/origin/${ref}`], u.path);
      if (lease && !o.overwrite) { const t = git.trailers(u.path, lease); if (t["Cs-Machine"] && t["Cs-Machine"] !== m.name) { ui.fail(`${label}: a parcel from ${t["Cs-Machine"]} is waiting on ${ref} — run cs resume there first, or --overwrite`); rc = 1; continue; } }
      const { sha, files } = await ui.spin(`${label}: snapshotting…`, () => buildParcel(u, p, m, o.note ?? "", (hoff(p).extra as string[]) ?? [], (hoff(p).exclude as string[]) ?? []));
      git.git(["update-ref", `refs/heads/${ref}`, sha], u.path);
      const push = await ui.spin(`${label}: pushing ${ref}…`, () => git.gitA(["push", "-q", `--force-with-lease=refs/heads/${ref}:${lease || ""}`, "origin", `refs/heads/${ref}:refs/heads/${ref}`], u.path, { check: false, timeout: 120 }));
      if (push.code !== 0) { ui.fail(`${label}: push rejected — ${push.err.split("\n").pop()}`); rc = 1; continue; }
      git.git(["update-ref", "-d", `refs/heads/${ref}`], u.path, { check: false });
      results.push({ ref, sha, branch: u.branch, worktree: u.rel, at: new Date().toISOString() }); pushed++;
      ui.step(`${label}: ${u.branch} → ${ref}  ${ui.dim(`${files} file(s)${ab && ab[0] ? ` + ${ab[0]} unpushed commit(s)` : ""}${o.note ? " · note" : ""}`)}`);
    }
    if (results.length) saveState(p, { handedOff: results, machine: m.name });
  }
  if (pushed) { try { rmSync(pendingFile(), { force: true }); } catch {} }
  return rc;
}

async function fetchParcels(root: string, user: string): Promise<Parcel[]> {
  await git.gitA(["fetch", "-q", "--prune", "origin", `+refs/heads/wip/${user}/*:refs/remotes/origin/wip/${user}/*`], root, { check: false, timeout: 60 });
  const refs = git.out(["for-each-ref", "--format=%(refname:short) %(objectname)", `refs/remotes/origin/wip/${user}/`], root).split("\n").filter(Boolean);
  return refs.map((l) => { const [full, sha] = l.split(" "); const t = git.trailers(root, sha); const ref = full.replace(/^origin\//, "");
    return { ref, sha, branch: t["Cs-Branch"] ?? "", base: t["Cs-Base"] ?? "", machine: t["Cs-Machine"] ?? "?", worktree: t["Cs-Worktree"] ?? ".", note: t["Cs-Note"] ?? "", when: git.out(["log", "-1", "--format=%cI", sha], root) }; }).filter((x) => x.branch);
}

function findOrCreateUnit(p: Project, ws: string, parcel: Parcel): { path: string; created: boolean } | undefined {
  const root = checkoutRoot(p, ws);
  const existing = units(p, ws).find((u) => u.branch === parcel.branch); if (existing) return { path: existing.path, created: false };
  if (p.layout === "worktrees") {
    const dir = join(container(p, ws), `wt-${git.slug(parcel.branch)}`);
    const hasBranch = !!git.out(["rev-parse", "--verify", "-q", `refs/heads/${parcel.branch}`], root);
    const r = git.git(["worktree", "add", "-q", ...(hasBranch ? [dir, parcel.branch] : ["-b", parcel.branch, dir, parcel.base])], root, { check: false });
    if (r.code !== 0) { ui.fail(`${p.name}: could not create worktree ${contract(dir)} — ${r.err.split("\n").pop()}`); return undefined; }
    return { path: dir, created: true };
  }
  if (git.isDirty(root)) { ui.fail(`${p.name}: ${contract(root)} is dirty and on ${git.currentBranch(root)}; commit/stash or use --replace`); return undefined; }
  const r = git.git(["checkout", "-q", "-B", parcel.branch, git.out(["rev-parse", "--verify", "-q", `refs/heads/${parcel.branch}`], root) || parcel.base], root, { check: false });
  if (r.code !== 0) { ui.fail(`${p.name}: checkout ${parcel.branch} failed — ${r.err.split("\n").pop()}`); return undefined; }
  return { path: root, created: false };
}

export async function resume(repo: string, m: Machine, man: Manifest, projects: Project[], o: { replace?: boolean; keepRemote?: boolean; dryRun?: boolean }): Promise<number> {
  const ws = workspace(man, m); let rc = 0;
  for (const p of projects) {
    if (!enabled(p)) continue;
    const root = checkoutRoot(p, ws); if (!existsSync(root) || !git.remoteUrl(root)) continue;
    const user = userSlug(root);
    const parcels = await ui.spin(`${p.name}: looking for parcels…`, () => fetchParcels(root, user));
    if (!parcels.length) { ui.skip(`${p.name}: nothing to resume`); continue; }
    for (const pc of parcels) {
      const label = `${p.name} · ${pc.branch}`;
      if (o.dryRun) { ui.step(`${label}: parcel from ${pc.machine} (${pc.when.slice(0, 16)})${pc.note ? " — " + pc.note : ""}`); continue; }
      const unit = findOrCreateUnit(p, ws, pc); if (!unit) { rc = 1; continue; }
      if (git.isDirty(unit.path)) {
        if (!o.replace) { ui.fail(`${label}: ${contract(unit.path)} has uncommitted changes — commit them, or --replace (keeps a backup ref)`); rc = 1; continue; }
        const backup = await buildParcel({ path: unit.path, branch: pc.branch, rel: relative(container(p, ws), unit.path) || "." }, p, m, "", [], []);
        const bref = `refs/cs/backup/${git.slug(pc.branch)}/${Date.now()}`; git.git(["update-ref", bref, backup.sha], unit.path);
        git.git(["reset", "-q", "--hard"], unit.path); git.git(["clean", "-qfd"], unit.path); ui.step(`${label}: local changes backed up to ${bref}`);
      }
      const ff = git.git(["merge", "-q", "--ff-only", pc.base], unit.path, { check: false });
      if (ff.code !== 0) { ui.fail(`${label}: branch diverged from the parcel's base ${pc.base.slice(0, 7)} — merge/rebase manually, then re-run`); rc = 1; continue; }
      const cp = git.git(["cherry-pick", "-n", "--allow-empty", pc.sha], unit.path, { check: false });
      if (cp.code !== 0) { git.git(["cherry-pick", "--abort"], unit.path, { check: false }); git.git(["reset", "-q", "--hard"], unit.path); ui.fail(`${label}: could not apply parcel — ${cp.err.split("\n").pop()}`); rc = 1; continue; }
      git.git(["reset", "-q"], unit.path);
      let extras: string[] = []; try { extras = JSON.parse(readFileSync(join(unit.path, SIDE, "manifest.json"), "utf8")).extras ?? []; } catch {}
      for (const e of extras) git.git(["rm", "-rq", "--cached", "--", e], unit.path, { check: false });
      let note = ""; try { note = readFileSync(join(unit.path, SIDE, "NOTE.md"), "utf8"); } catch {}
      rmSync(join(unit.path, SIDE), { recursive: true, force: true });
      const wasQuiet = ui.isQuiet(); ui.setQuiet(true); try { runLink(repo, m, man, [p.name]); } finally { ui.setQuiet(wasQuiet); }
      if (!o.keepRemote) { await ui.spin(`${label}: removing ${pc.ref} from origin…`, () => git.gitA(["push", "-q", "origin", "--delete", pc.ref], unit.path, { check: false, timeout: 60 })); git.git(["update-ref", "-d", `refs/remotes/origin/${pc.ref}`], unit.path, { check: false }); }
      if (note) { mkdirSync(handoffStateDir(), { recursive: true }); writeFileSync(noteFile(p), note); }
      saveState(p, { resumed: { branch: pc.branch, from: pc.machine, at: new Date().toISOString(), path: unit.path } });
      ui.step(`${label}: restored in ${contract(unit.path)}${unit.created ? ui.dim(" (worktree created)") : ""}  ${ui.dim(`${git.dirtyCount(unit.path)} change(s) from ${pc.machine}`)}`);
      if (note) ui.note(note.trim().split("\n"), `note from ${pc.machine}`);
    }
  }
  return rc;
}

export async function wipList(m: Machine, man: Manifest, projects: Project[]): Promise<Parcel[]> {
  const ws = workspace(man, m); const all: Parcel[] = [];
  for (const p of projects) { const root = checkoutRoot(p, ws); if (!existsSync(root) || !git.remoteUrl(root) || !enabled(p)) continue;
    const parcels = await ui.spin(`${p.name}: fetching parcels…`, () => fetchParcels(root, userSlug(root)));
    for (const pc of parcels) all.push({ ...pc, ref: pc.ref, worktree: p.name });
  }
  return all;
}
export async function wipGc(m: Machine, man: Manifest, projects: Project[], olderThanDays: number): Promise<number> {
  const ws = workspace(man, m); let n = 0;
  for (const p of projects) { const root = checkoutRoot(p, ws); if (!existsSync(root) || !git.remoteUrl(root)) continue;
    for (const pc of await fetchParcels(root, userSlug(root))) { const age = (Date.now() - Date.parse(pc.when)) / 86400000; if (age < olderThanDays) continue;
      await git.gitA(["push", "-q", "origin", "--delete", pc.ref], root, { check: false }); ui.step(`${p.name}: dropped ${pc.ref} (${Math.floor(age)} days old)`); n++; } }
  return n;
}
export async function wipDrop(m: Machine, man: Manifest, p: Project, ref: string): Promise<void> {
  const root = checkoutRoot(p, workspace(man, m)); const full = ref.startsWith("wip/") ? ref : wipRef(userSlug(root), ref);
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
/** SessionEnd hook: remember that dirty work exists here (no network). */
export function markPending(man: Manifest, m: Machine, cwd = process.cwd()): void {
  const p = projectForPath(man, m, cwd); if (!p || !enabled(p)) return;
  const top = git.toplevel(cwd); if (!top || !git.isDirty(top)) return;
  mkdirSync(handoffStateDir(), { recursive: true });
  let cur: Record<string, string> = {}; try { cur = JSON.parse(readFileSync(pendingFile(), "utf8")); } catch {}
  cur[p.name] = new Date().toISOString(); writeFileSync(pendingFile(), JSON.stringify(cur));
}
export function pending(): Record<string, string> { try { return JSON.parse(readFileSync(pendingFile(), "utf8")); } catch { return {}; } }
export function clearPending(name: string) { const cur = pending(); delete cur[name]; writeFileSync(pendingFile(), JSON.stringify(cur)); }
export const projectsFor = (man: Manifest, m: Machine, names: string[], all: boolean): Project[] => {
  if (names.length) return names.map((n) => { const p = man.projects[n]; if (!p) throw new Error(`cs: unknown project '${n}'`); return p; });
  if (all) return selectedProjects(man, m);
  const p = projectForPath(man, m, process.cwd()); if (!p) throw new Error("cs: not inside a registered project (pass a name or --all)"); return [p];
};
