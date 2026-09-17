/** cs remove <names...>: take projects out of the share — manifest entry, project state, secrets — in one share commit, after
 *  one confirmation that lists exactly what goes. Checkouts and remotes are never touched; the only tidy-up inside a
 *  checkout is the auto-memory pointer cs wrote there. The share's history keeps everything (undo: git revert). */
import { existsSync, readdirSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { contract } from "./paths.js";
import { NAME_RE, projectTableRe, type Project } from "./manifest.js";
import { commit, manifestText, removeProject, workspace, type Share } from "./share.js";
import { dirs, fetchWaiting, locate, present } from "./checkout.js";
import { forget, projectState, statesDir } from "./projectstate.js";
import { fileOf } from "./env.js";
import { parseRepoUrl } from "./sharekey.js";
import * as ui from "./ui.js";

const secretsDir = (repo: string) => join(repo, "secrets", "projects");
/** Entries under secrets/projects/ (`<entry>.env`), by name. */
const secretEntries = (repo: string): string[] => (existsSync(secretsDir(repo)) ? readdirSync(secretsDir(repo)).filter((f) => f.endsWith(".env")).map((f) => f.slice(0, -4)).sort() : []);
/** The entries that belong to `name`: its `.env` and its `.env.<suffix>` files (src/env.ts's naming) — unless the entry is a registered project of its own. */
export function secretsFiles(share: Share, name: string): string[] {
  return secretEntries(share.path).filter((e) => fileOf(name, e) && (e === name || !share.manifest.projects[e])).map((e) => join(secretsDir(share.path), `${e}.env`));
}
/** Names that have project state or secrets in the share but no manifest entry — leftovers cs doctor points at cs remove for.
 *  An entry that reads as another orphan's `.env.<suffix>` is folded into that orphan: one `cs remove <name>` takes both. */
export function orphans(share: Share): string[] {
  const repo = share.path, man = share.manifest; const names = new Set<string>(), state = new Set<string>(); const registered = Object.keys(man.projects);
  const st = statesDir(share);
  if (existsSync(st)) for (const e of readdirSync(st, { withFileTypes: true })) if (e.isDirectory() && !man.projects[e.name]) { names.add(e.name); state.add(e.name); }
  for (const e of secretEntries(repo)) if (!registered.some((p) => fileOf(p, e))) names.add(e);
  return [...names].filter((n) => state.has(n) || ![...names].some((o) => o !== n && fileOf(o, n))).sort();
}

interface Target { name: string; project?: Project; state?: string; secrets: string[]; here: string[] }
const countFiles = (dir: string): number => readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? countFiles(join(dir, e.name)) : e.isFile() && e.name !== ".gitkeep" ? 1 : 0), 0);
const subTables = (text: string, name: string) => [...text.matchAll(projectTableRe(name, "gm"))].map((m) => m[0].replace(/\s*(#.*)?$/, ""));

/** A name is accepted when any of the three exists; unknown when none does. */
function resolve(share: Share, names: string[]): Target[] {
  const repo = share.path, man = share.manifest;
  const known = [...new Set([...Object.keys(man.projects), ...orphans(share)])].sort();
  const ws = workspace(share);
  return names.map((name) => {
    if (!NAME_RE.test(name)) throw new Error(`cs: '${name}' is not a project name`);
    const project = man.projects[name]; const state = projectState(share, name);
    const t: Target = { name, project, state: existsSync(state) ? state : undefined, secrets: secretsFiles(share, name), here: project ? dirs(project, ws) : [] };
    if (!t.project && !t.state && !t.secrets.length) throw new Error(`cs: unknown project '${name}'\nknown: ${known.join(", ") || "(none)"}`);
    return t;
  });
}

/** Never blocks: what the removal leaves behind elsewhere, so the user knows before saying yes. */
async function warnings(t: Target, ws: string) {
  if (t.secrets.length) ui.warn(`${t.name}: .env values stored in the share go with it — the checkout's own .env files stay`);
  if (!t.project?.url) return;
  const c = locate(t.project, ws);
  if (present(c)) {   // what the last fetch brought, no network: a handoff left on the remote stays there
    for (const h of (await fetchWaiting(c, { fetch: false })).list) ui.warn(`${t.name}: a handoff from ${h.machine} (${h.branch}) is waiting on the remote — it stays there, the remote is not touched`);
  } else ui.warn(`${t.name}: no checkout here to look for waiting handoffs — one left on the remote stays there (cs handoffs on a machine that has it)`);
}
function summary(t: Target, manifestText: string) {
  const lines: string[] = [];
  if (t.project) lines.push(`goes   manifest entry  ${ui.dim(subTables(manifestText, t.name).join(" "))}`);
  if (t.state) lines.push(`goes   project state   ${ui.dim(`projects/${t.name}/ (${countFiles(t.state)} files, memory included)`)}`);
  for (const f of t.secrets) lines.push(`goes   secrets         ${ui.dim(`secrets/projects/${f.split("/").pop()}`)}`);
  for (const c of t.here) lines.push(`kept   checkout        ${ui.dim(contract(c))}`);
  if (!t.here.length) lines.push(`kept   checkout        ${ui.dim("none on this machine")}`);
  if (t.project?.url) lines.push(`kept   remote          ${ui.dim(t.project.url)}`);
  return lines;
}

export async function remove(share: Share, names: string[], o: { yes?: boolean; noCommit?: boolean } = {}): Promise<string> {
  const repo = share.path; const targets = resolve(share, [...new Set(names)]); const ws = workspace(share);
  const text = manifestText(share);
  for (const t of targets) ui.note(summary(t, text), t.name);
  for (const t of targets) await warnings(t, ws);
  const label = targets.map((t) => t.name).join(", ");
  if (!o.yes) {
    if (!ui.canAsk()) throw new Error(`cs: no terminal to confirm\nadd --yes to remove ${label} unattended`);
    if (!(await ui.confirm(`remove ${label} from the share? (checkouts and remotes stay)`, false))) return ui.dim("nothing removed");
  }
  const paths: string[] = [];
  for (const t of targets) {
    if (removeProject(share, t.name)) paths.push("projects.toml");
    if (t.state) { rmSync(t.state, { recursive: true, force: true }); paths.push(relative(repo, t.state)); }
    for (const f of t.secrets) { rmSync(f, { force: true }); paths.push(relative(repo, f)); }
    for (const l of forget(t.name, t.here)) ui.step(l);
  }
  // exactly the removal — nothing else the share may have pending — so one git revert brings it all back
  const sha = o.noCommit ? "" : commit(share, `remove ${label}`, [...new Set(paths)]) ?? "";
  ui.ok(`removed ${label} from the share${sha ? `  ${ui.dim(`commit ${sha}`)}` : ui.dim(o.noCommit ? "  (not committed: --no-commit)" : "  (nothing to commit — the share had none of it committed)")}`);
  for (const t of targets) {
    for (const c of t.here) ui.info(`${t.name}: checkout kept at ${contract(c)} — just a directory now, yours to keep or rm`);
    if (t.project?.url) { const [, gh] = parseRepoUrl(t.project.url); ui.info(ui.dim(gh ? `${t.name}: the GitHub repo stays — to delete it too, by hand: gh repo delete ${gh[0]}/${gh[1]}` : `${t.name}: the remote stays — ${t.project.url}`)); }
  }
  return sha ? ui.dim(`undo: git -C ${contract(repo)} revert ${sha}, then cs sync everywhere`) : ui.dim("the share pushes with the next cs sync");
}
