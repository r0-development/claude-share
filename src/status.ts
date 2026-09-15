/** cs status: config repo + every selected project + unregistered dirs. */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as git from "./git.js";
import { contract, stateDir } from "./paths.js";
import type { Machine } from "./config.js";
import { checkoutRoot, selected, workspace, type Manifest } from "./manifest.js";
import * as ui from "./ui.js";

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
export function runStatus(repo: string, m: Machine, man: Manifest, fetch = false, showAll = false): number {
  const ws = workspace(man, m);
  ui.info(`${ui.bold(m.name)}  ${ui.dim("profiles")} ${m.profiles.join(", ")}  ${ui.dim("workspace")} ${contract(ws)}`);
  const [branch, state] = repoState(repo, fetch); const mk = join(stateDir(), "blocked-config");
  ui.table([[ui.bold("config repo"), branch, state + (existsSync(mk) ? "  " + ui.red("BLOCKED: " + readFileSync(mk, "utf8").trim()) : "")]]);
  let rc = 0; const rows: string[][] = []; const known = new Set<string>();
  for (const p of Object.values(man.projects)) {
    known.add(p.path || p.name); const sel = selected(p, m); if (!sel && !showAll) continue;
    const root = checkoutRoot(p, ws); const kind = ui.dim(p.kind + (p.layout === "worktrees" ? " ⑂" : ""));
    if (!sel) { rows.push([p.name, kind, "", ui.dim("skipped (profile)")]); continue; }
    if (!existsSync(root)) { rows.push([p.name, kind, "", ui.red("missing") + ui.dim("  cs clone")]); rc = 1; continue; }
    if (p.kind === "git" && git.isRepo(root)) {
      let [b, s, att] = repoState(root, fetch); const url = git.remoteUrl(root);
      if (p.url && git.canonicalGithub(url) !== git.canonicalGithub(p.url)) { s += "  " + ui.red(`remote≠manifest (${url})`); att = true; }
      const ident = p.identity ? man.identities[p.identity] : undefined; const email = git.configGet(root, "user.email");
      if (ident && email && email !== ident.email) { s += "  " + ui.red(`identity ${email}`); att = true; } else if (ident && !email) { s += "  " + ui.red("identity unset"); att = true; }
      if (p.layout === "worktrees") s += "  " + ui.dim(`${git.worktrees(root).length} worktrees`);
      if (att) rc = 1; rows.push([p.name, kind, b, s]);
    } else rows.push([p.name, kind, "", ui.green("present")]);
  }
  ui.table(rows, ["project", "kind", "branch", "state"]);
  const unreg = existsSync(ws) ? readdirSync(ws, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".") && !known.has(d.name)).map((d) => d.name).sort() : [];
  if (unreg.length) ui.warn("unregistered under workspace: " + unreg.join(", ") + ui.dim("   (cs add <path>)"));
  return rc;
}
