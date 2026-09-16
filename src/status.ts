/** cs status: share + every selected project + unregistered dirs. */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as git from "./git.js";
import { contract, stateDir } from "./paths.js";
import type { Machine } from "./machine.js";
import { checkoutRoot, selected, workspace, type Manifest } from "./manifest.js";
import * as ui from "./ui.js";
import { pending } from "./handoff.js";

/** Directories directly under the workspace that no project claims — a project forgotten or never pushed. */
export function unregisteredDirs(ws: string, known: Set<string>): { name: string; remote: string }[] {
  if (!existsSync(ws)) return [];
  return readdirSync(ws, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".") && !known.has(d.name)).map((d) => d.name).sort()
    .map((name) => { const root = existsSync(join(ws, name, "repo", ".git")) ? join(ws, name, "repo") : join(ws, name); return { name, remote: git.isRepo(root) ? git.remoteUrl(root) : "" }; });
}
function repoState(path: string, fetch: boolean): [string, string, boolean] {
  if (!git.isRepo(path)) return ["", ui.dim("not a git repo"), false];
  if (fetch) git.git(["fetch", "-q", "--prune"], path, { check: false, timeout: 15 });
  const branch = git.currentBranch(path) || ui.red("DETACHED"); const dirty = git.dirtyCount(path); const ab = git.aheadBehind(path);
  const bits: string[] = []; let attention = false;
  if (dirty) { bits.push(ui.yellow(`${dirty} dirty`)); attention = true; }
  if (ab) { if (ab[0]) { bits.push(ui.yellow(`↑${ab[0]} unpushed`)); attention = true; } if (ab[1]) bits.push(ui.cyan(`↓${ab[1]} behind`)); }
  else if (!branch.includes("DETACHED")) bits.push(ui.dim("no upstream"));
  if (!bits.length) bits.push(ui.green("clean"));
  return [branch, bits.join("  "), attention];
}
export async function runStatus(repo: string, m: Machine, man: Manifest, fetch = false, showAll = false): Promise<number> {
  const ws = workspace(man, m);
  if (fetch) await ui.spin("fetching all remotes…", async () => {});
  ui.info(`${ui.dim("profiles")} ${m.profiles.join(", ")}  ${ui.dim("workspace")} ${contract(ws)}`);
  const [branch, state] = repoState(repo, fetch); const mk = join(stateDir(), "blocked-config");
  ui.table([[ui.bold("share"), branch, state + (existsSync(mk) ? "  " + ui.red("BLOCKED: " + readFileSync(mk, "utf8").trim()) : "")]]);
  let rc = 0; const rows: string[][] = []; const known = new Set<string>(); const pend = pending();
  for (const p of Object.values(man.projects)) {
    known.add(p.path || p.name); const sel = selected(p, m); if (!sel && !showAll) continue;
    const root = checkoutRoot(p, ws); const kind = ui.dim(p.layout === "worktrees" ? "⑂" : "");
    if (!sel) { rows.push([p.name, kind, "", ui.dim("skipped (profile)")]); continue; }
    if (!existsSync(root)) { rows.push([p.name, kind, "", p.url ? ui.red("missing") + ui.dim("  cs clone") : ui.red("no remote, not here") + ui.dim("  cs doctor --fix on the machine that has it")]); rc = 1; continue; }
    if (git.isRepo(root)) {
      let [b, s, att] = repoState(root, fetch); const url = git.remoteUrl(root);
      if (!url || !p.url) { s += "  " + ui.red("no remote") + ui.dim("  cs doctor --fix"); att = true; }
      else if (git.canonicalGithub(url) !== git.canonicalGithub(p.url)) { s += "  " + ui.red(`remote≠manifest (${url})`); att = true; }
      const ident = p.identity ? man.identities[p.identity] : undefined; const email = git.configGet(root, "user.email");
      if (ident && email && email !== ident.email) { s += "  " + ui.red(`identity ${email}`); att = true; } else if (ident && !email) { s += "  " + ui.red("identity unset"); att = true; }
      if (p.layout === "worktrees") s += "  " + ui.dim(`${git.worktrees(root).length} worktrees`);
      if (pend[p.name]) s += "  " + ui.yellow("uncommitted work — cs sync");
      if (att) rc = 1; rows.push([p.name, kind, b, s]);
    } else { rows.push([p.name, kind, "", ui.red("not a git repo") + ui.dim("  cs doctor --fix")]); rc = 1; }
  }
  ui.table(rows, ["project", "", "branch", "state"]);
  for (const d of unregisteredDirs(ws, known)) ui.warn(`${d.name}: ${d.remote ? "not registered" : "not registered, no remote"}  ${ui.dim(`cs add ${contract(join(ws, d.name))}`)}`);
  return rc;
}
