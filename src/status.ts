/** Bare cs: the read-only view — is anything waiting for me, anything stale here. Fetches every project and the share
 *  (same gather step as cs sync: per-project time cap, offline tolerated; --no-fetch for scripts), then one line per
 *  project, the share's line, unregistered workspace directories, and the command that resolves whatever needs attention. */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as git from "./git.js";
import { contract } from "./paths.js";
import type { Machine } from "./machine.js";
import { checkoutRoot, selected, workspace, type Manifest } from "./manifest.js";
import { gather } from "./gather.js";
import { hooksStatus } from "./hooks.js";
import { ago, status, type Facts, type StatusBit } from "./plan.js";
import * as ui from "./ui.js";

/** Directories directly under the workspace that no project claims — a project forgotten or never pushed. */
export function unregisteredDirs(ws: string, known: Set<string>): { name: string; remote: string }[] {
  if (!existsSync(ws)) return [];
  return readdirSync(ws, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".") && !known.has(d.name)).map((d) => d.name).sort()
    .map((name) => { const root = existsSync(join(ws, name, "repo", ".git")) ? join(ws, name, "repo") : join(ws, name); return { name, remote: git.isRepo(root) ? git.remoteUrl(root) : "" }; });
}

const SYNC = ui.dim("  cs sync"), FIX = ui.dim("  cs doctor --fix");
const branchOf = (path: string) => git.currentBranch(path) || ui.red("DETACHED");
const paint = (b: StatusBit) => (b.kind === "offline" || b.kind === "disabled" ? ui.dim(b.text) : b.kind === "skip" ? ui.red(b.text) : ui.yellow(b.text));
/** The bits of one project's line, painted, plus the command when cs sync has something to do there. */
function projectLine(f: Facts, machine: string): { state: string; pending: boolean; stuck: boolean } {
  const { bits, pending, stuck } = status(f, machine);
  return { state: (bits.length ? bits.map(paint).join("  ") : ui.green("clean")) + (pending ? SYNC : ""), pending, stuck };
}

/** The share's own line: its checkout, what the last fetch says other machines pushed, and when it last synced here. */
async function shareLine(repo: string, fetch: boolean, timeout: number): Promise<{ row: string[]; pending: boolean; broken: boolean }> {
  const row = (branch: string, state: string) => [ui.bold("share"), "", branch, state];
  if (!git.isRepo(repo)) return { row: row("", ui.red("not a git repo") + FIX), pending: false, broken: true };
  if (!git.remoteUrl(repo)) return { row: row(branchOf(repo), ui.red("no remote") + FIX), pending: false, broken: true };
  const offline = fetch && (await ui.spin("share: fetching…", () => git.gitA(["fetch", "-q", "--prune", "origin"], repo, { check: false, timeout }))).code !== 0;
  const dirty = git.dirtyCount(repo); const [ahead, behind] = git.aheadBehind(repo) ?? [0, 0];
  const bits = [dirty ? ui.yellow(`${dirty} dirty`) : "", ahead ? ui.yellow(`↑${ahead} unpushed`) : "", behind ? ui.yellow(`↓${behind} from other machines`) : "", offline ? ui.dim("offline") : ""].filter(Boolean);
  const last = hooksStatus(repo).lastSync; const when = !last ? "never synced" : isNaN(Date.parse(last)) ? `last sync failed (${last})` : `synced ${ago(last)}`;
  const pending = dirty + ahead + behind > 0;
  return { row: row(branchOf(repo), (bits.length ? bits.join("  ") : ui.green("clean")) + "  " + ui.dim(when) + (pending ? SYNC : "")), pending, broken: false };
}

export interface StatusResult { rc: number; next?: string }
/** `next` is the command that resolves what was found: cs sync when it would move something, cs doctor --fix for what
 *  doctor repairs. Work cs sync cannot carry (detached HEAD, files that look secret) is attention too — its line says what to do. */
export async function runStatus(repo: string, m: Machine, man: Manifest, fetch = true, showAll = false, timeout = 10): Promise<StatusResult> {
  const ws = workspace(man, m);
  ui.info(`${ui.dim("profiles")} ${m.profiles.join(", ")}  ${ui.dim("workspace")} ${contract(ws)}${fetch ? "" : ui.dim("  (not fetched)")}`);
  const share = await shareLine(repo, fetch, timeout);
  const { facts } = await ui.spin("fetching projects…", () => gather(m, man, { timeout, fetch }));
  const byName = new Map(facts.map((f) => [f.project, f]));
  let pending = share.pending, attention = share.broken, stuck = false;
  const rows: string[][] = [share.row]; const known = new Set<string>();
  for (const p of Object.values(man.projects)) {
    known.add(p.path || p.name); const sel = selected(p, m); if (!sel && !showAll) continue;
    const root = checkoutRoot(p, ws); const kind = ui.dim(p.layout === "worktrees" ? "⑂" : "");
    const f = byName.get(p.name);
    if (!sel) rows.push([p.name, kind, "", ui.dim("skipped (profile)")]);
    else if (!existsSync(root)) { rows.push([p.name, kind, "", p.url ? ui.red("missing here") + SYNC : ui.red("no remote, not here") + ui.dim("  cs doctor --fix on the machine that has it")]); if (p.url) pending = true; else attention = true; }
    else if (!git.isRepo(root)) { rows.push([p.name, kind, "", ui.red("not a git repo") + FIX]); attention = true; }
    else if (!f) { rows.push([p.name, kind, branchOf(root), ui.red("no remote") + FIX]); attention = true; }
    else { const line = projectLine(f, m.name); rows.push([p.name, kind, f.units[0]?.branch || ui.red("DETACHED"), line.state]); pending ||= line.pending; stuck ||= line.stuck; }
  }
  ui.table(rows, ["project", "", "branch", "state"]);
  for (const d of unregisteredDirs(ws, known)) { ui.warn(`${d.name}: ${d.remote ? "not registered" : "not registered, no remote"}  ${ui.dim(`cs add ${contract(join(ws, d.name))}`)}`); attention = true; }
  return { rc: pending || attention || stuck ? 1 : 0, next: pending ? "cs sync" : attention ? "cs doctor --fix" : undefined };
}
