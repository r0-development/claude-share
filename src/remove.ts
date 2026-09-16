/** cs remove <names...>: take projects out of the share — manifest entry, project state, secrets — in one share commit, after
 *  one confirmation that lists exactly what goes. Checkouts and remotes are never touched; the only tidy-up inside a
 *  checkout is the auto-memory pointer cs wrote there. The share's history keeps everything (undo: git revert). */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import * as git from "./git.js";
import { contract } from "./paths.js";
import type { Machine } from "./machine.js";
import { checkoutRoot, NAME_RE, removeProjectText, workspace, type Manifest, type Project } from "./manifest.js";
import { checkouts, dropPlacedRecord, stripPointer } from "./link.js";
import { fetchHandoffs, userSlug } from "./handoff.js";
import * as ui from "./ui.js";

const secretsDir = (repo: string) => join(repo, "secrets", "projects");
/** The entries under secrets/projects/ that belong to `name`: `<name>.env` (its .env) and `<name>.<suffix>.env` (its .env.<suffix>),
 *  unless `<name>.<suffix>` is itself a registered project (src/env.ts resolves the same ambiguity the same way). */
export function secretsFiles(repo: string, man: Manifest, name: string): string[] {
  const d = secretsDir(repo); if (!existsSync(d)) return [];
  return readdirSync(d).filter((f) => f.endsWith(".env")).filter((f) => { const e = f.slice(0, -4); return e === name || (e.startsWith(name + ".") && !man.projects[e]); }).map((f) => join(d, f)).sort();
}
/** Names that have project state or secrets in the share but no manifest entry — leftovers cs doctor points at cs remove for. */
export function orphans(repo: string, man: Manifest): string[] {
  const names = new Set<string>();
  const st = join(repo, "projects");
  if (existsSync(st)) for (const e of readdirSync(st, { withFileTypes: true })) if (e.isDirectory() && !man.projects[e.name]) names.add(e.name);
  if (existsSync(secretsDir(repo))) for (const f of readdirSync(secretsDir(repo))) if (f.endsWith(".env")) { const e = f.slice(0, -4); if (!man.projects[e] && !Object.keys(man.projects).some((p) => e.startsWith(p + "."))) names.add(e); }
  return [...names].sort();
}

interface Target { name: string; project?: Project; state?: string; secrets: string[]; here: string[] }
const countFiles = (dir: string): number => readdirSync(dir, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? countFiles(join(dir, e.name)) : e.isFile() && e.name !== ".gitkeep" ? 1 : 0), 0);
const subTables = (text: string, name: string) => [...text.matchAll(new RegExp(`^\\[projects\\.${name.replace(/[.]/g, "\\.")}(\\.[^\\]]+)?\\]`, "gm"))].map((m) => m[0]);
const githubRepo = (url: string) => git.canonicalGithub(url).match(/^git@github\.com:([^/]+)\/(.+)\.git$/)?.slice(1, 3);

/** A name is accepted when any of the three exists; unknown when none does. */
function resolve(repo: string, m: Machine, man: Manifest, names: string[]): Target[] {
  const known = [...new Set([...Object.keys(man.projects), ...orphans(repo, man)])].sort();
  const ws = workspace(man, m);
  return names.map((name) => {
    if (!NAME_RE.test(name)) throw new Error(`cs: '${name}' is not a project name`);
    const project = man.projects[name]; const state = join(repo, "projects", name);
    const t: Target = { name, project, state: existsSync(state) ? state : undefined, secrets: secretsFiles(repo, man, name), here: project ? checkouts(project, ws) : [] };
    if (!t.project && !t.state && !t.secrets.length) throw new Error(`cs: unknown project '${name}'\nknown: ${known.join(", ") || "(none)"}`);
    return t;
  });
}

/** Never blocks: what the removal leaves behind elsewhere, so the user knows before saying yes. */
async function warnings(t: Target, ws: string) {
  if (t.secrets.length) ui.warn(`${t.name}: .env values stored in the share go with it — the checkout's own .env files stay`);
  if (!t.project) return;
  const root = checkoutRoot(t.project, ws);
  if (t.project.url && existsSync(root) && git.isRepo(root))   // what the last fetch brought, no network: a handoff left on the remote stays there
    for (const h of (await fetchHandoffs(root, userSlug(root), 0, false)).list) ui.warn(`${t.name}: a handoff from ${h.machine} (${h.branch}) is waiting on the remote — it stays there, the remote is not touched`);
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

export async function remove(repo: string, m: Machine, man: Manifest, names: string[], o: { yes?: boolean; noCommit?: boolean } = {}): Promise<string> {
  const targets = resolve(repo, m, man, [...new Set(names)]); const ws = workspace(man, m);
  const manifestFile = join(repo, "projects.toml"); let text = readFileSync(manifestFile, "utf8");
  for (const t of targets) ui.note(summary(t, text), t.name);
  for (const t of targets) await warnings(t, ws);
  const label = targets.map((t) => t.name).join(", ");
  if (!o.yes) {
    if (!ui.canAsk()) throw new Error(`cs: no terminal to confirm\nadd --yes to remove ${label} unattended`);
    if (!(await ui.confirm(`remove ${label} from the share? (checkouts and remotes stay)`, false))) { ui.info(ui.dim("nothing removed")); return ui.dim("nothing removed"); }
  }
  const paths: string[] = [];
  for (const t of targets) {
    const r = removeProjectText(text, t.name); if (r.found) { text = r.text; paths.push("projects.toml"); }
    if (t.state) { rmSync(t.state, { recursive: true, force: true }); paths.push(relative(repo, t.state)); }
    for (const f of t.secrets) { rmSync(f, { force: true }); paths.push(relative(repo, f)); }
    for (const c of t.here) if (stripPointer(c)) ui.step(`${t.name}: auto-memory pointer removed from ${contract(c)}`);
    dropPlacedRecord(t.name);
  }
  if (paths.includes("projects.toml")) writeFileSync(manifestFile, text);
  let sha = "";
  if (!o.noCommit && git.isRepo(repo)) {   // exactly the removal — nothing else the share may have pending — so one git revert brings it all back
    for (const p of new Set(paths)) git.git(["add", "-A", "--", p], repo, { check: false });   // a state dir never committed matches nothing: fine
    if (git.git(["diff", "--cached", "--quiet"], repo, { check: false }).code !== 0) { git.commit(repo, `remove ${label}`, "cs", `cs@${m.name}`); sha = git.out(["rev-parse", "--short", "HEAD"], repo); }
  }
  ui.ok(`removed ${label} from the share${sha ? `  ${ui.dim(`commit ${sha}`)}` : o.noCommit ? ui.dim("  (not committed: --no-commit)") : ""}`);
  for (const t of targets) {
    for (const c of t.here) ui.info(`${t.name}: checkout kept at ${contract(c)} — just a directory now, yours to keep or rm`);
    if (t.project?.url) { const gh = githubRepo(t.project.url); ui.info(ui.dim(gh ? `${t.name}: the GitHub repo stays — to remove it too, by hand: gh repo delete ${gh[0]}/${gh[1]}` : `${t.name}: the remote stays — ${t.project.url}`)); }
  }
  return sha ? ui.dim(`undo: git -C ${contract(repo)} revert ${sha}, then cs sync everywhere`) : ui.dim("the share pushes with the next cs sync");
}
