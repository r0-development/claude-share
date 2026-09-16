/** cs link: project state (<share>/projects/<name>/) ⇄ every checkout, newer wins; autoMemoryDirectory injected. */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, unlinkSync, utimesSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import * as git from "./git.js";
import { contract, stateDir } from "./paths.js";
import type { Machine } from "./machine.js";
import { checkoutRoot, selectedProjects, workspace, type Manifest, type Project } from "./manifest.js";
import { dumps } from "./jsonmerge.js";
import * as ui from "./ui.js";

const ROOT_FILES = ["CLAUDE.md", "CLAUDE.local.md", ".mcp.json"];
const SKIP_UNDER_CLAUDE = new Set(["worktrees", "plans", "settings.json"]);
const EXCLUDE_LINES = [".claude/", ".mcp.json", "CLAUDE.md", "CLAUDE.local.md"];
const SETTINGS_LOCAL = ".claude/settings.local.json";
const NOT_SYNCED = new Set(["memory", "secrets"]);

export const projectState = (repo: string, p: Project) => join(repo, "projects", p.name);
export const memoryDir = (repo: string, p: Project) => join(projectState(repo, p), "memory");
export function checkouts(p: Project, ws: string): string[] { return checkoutsAt(checkoutRoot(p, ws)); }
/** The checkout at `root` and its worktrees; nothing when the directory is absent. */
function checkoutsAt(root: string): string[] {
  if (!existsSync(root)) return [];
  if (!git.isRepo(root)) return [root];
  const w = git.worktrees(root); return w.length ? w : [root];
}
function walk(dir: string, fn: (f: string) => void, skipDir?: (rel: string) => boolean, base = dir) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name); const rel = relative(base, f);
    if (e.isDirectory()) { if (!skipDir?.(rel)) walk(f, fn, skipDir, base); } else if (e.isFile()) fn(rel);
  }
}
function managedRels(base: string): Set<string> {
  const rels = new Set<string>();
  for (const f of ROOT_FILES) if (existsSync(join(base, f)) && statSync(join(base, f)).isFile()) rels.add(f);
  walk(join(base, ".claude"), (rel) => { if (rel !== "settings.json") rels.add(".claude/" + rel); }, (rel) => SKIP_UNDER_CLAUDE.has(rel.split("/")[0]));
  return rels;
}
function sideRels(side: string): Set<string> { const rels = new Set<string>(); walk(side, (rel) => rels.add(rel), (rel) => NOT_SYNCED.has(rel.split("/")[0])); return rels; }
function normalize(rel: string, data: Buffer): Buffer {
  if (rel !== SETTINGS_LOCAL) return data;
  try { const d = JSON.parse(data.toString("utf8") || "{}"); delete d.autoMemoryDirectory; return Buffer.from(Object.keys(d).length ? dumps(d) : ""); } catch { return data; }
}
function localize(rel: string, data: Buffer, mem: string): Buffer {
  if (rel !== SETTINGS_LOCAL) return data;
  let d: any = {}; try { d = data.toString("utf8").trim() ? JSON.parse(data.toString("utf8")) : {}; } catch {}
  d.autoMemoryDirectory = contract(mem); return Buffer.from(dumps(d));
}
/** Which files the project state placed last time, so a file deleted from the state is removed from the checkouts. */
const placedDir = () => join(stateDir(), "project-state");
const stateFile = (p: Project) => join(placedDir(), `${p.name}.json`);
const loadState = (p: Project): Set<string> => { try { return new Set(JSON.parse(readFileSync(stateFile(p), "utf8")).files); } catch { return new Set(); } };
const saveState = (p: Project, files: Set<string>) => { mkdirSync(dirname(stateFile(p)), { recursive: true }); writeFileSync(stateFile(p), JSON.stringify({ files: [...files].sort() }, null, 2)); };
export const dropPlacedRecord = (name: string) => rmSync(join(placedDir(), `${name}.json`), { force: true });
/** The one thing cs wrote into a checkout that points at the share: the auto-memory location in .claude/settings.local.json.
 *  Removes the key; the file goes when nothing else is left in it. Nothing else in the checkout is touched. True when it changed something. */
export function stripPointer(checkout: string): boolean {
  const f = join(checkout, SETTINGS_LOCAL); if (!existsSync(f)) return false;
  let d: any; try { d = JSON.parse(readFileSync(f, "utf8") || "{}"); } catch { return false; }
  if (!("autoMemoryDirectory" in d)) return false;
  delete d.autoMemoryDirectory;
  Object.keys(d).length ? writeFileSync(f, dumps(d)) : unlinkSync(f);
  return true;
}
/** A placed-files record whose name is no longer in the manifest means the project was removed from the share (cs remove
 *  on another machine): strip the pointer from the checkout at the project's default location — plain or `<name>/repo`
 *  with its worktrees — and drop the record. Returns one line per checkout changed. */
export function sweepRemoved(man: Manifest, ws: string): string[] {
  const changes: string[] = []; if (!existsSync(placedDir())) return changes;
  for (const f of readdirSync(placedDir())) {
    if (!f.endsWith(".json")) continue; const name = f.slice(0, -5); if (man.projects[name]) continue;
    const root = existsSync(join(ws, name, "repo", ".git")) ? join(ws, name, "repo") : join(ws, name);
    for (const c of checkoutsAt(root)) if (stripPointer(c)) changes.push(`${name}: auto-memory pointer removed from ${contract(c)} (project removed from the share)`);
    dropPlacedRecord(name);
  }
  return changes;
}
function write(path: string, data: Buffer, mtime?: number) {
  mkdirSync(dirname(path), { recursive: true }); const tmp = path + ".cs-tmp"; writeFileSync(tmp, data);
  if (mtime) utimesSync(tmp, mtime, mtime); renameSync(tmp, path);
}
export function ensureExclude(checkout: string, check: boolean, changes: string[]) {
  if (!existsSync(join(checkout, ".git"))) return;
  const ex = git.infoExclude(checkout); const text = existsSync(ex) ? readFileSync(ex, "utf8") : "";
  const missing = EXCLUDE_LINES.filter((l) => !text.split("\n").includes(l));
  if (!missing.length) return;
  changes.push(`exclude ${missing.join(", ")} in ${contract(checkout)}`);
  if (!check) { mkdirSync(dirname(ex), { recursive: true }); writeFileSync(ex, text + (!text || text.endsWith("\n") ? "" : "\n") + "# claude-share managed files\n" + missing.join("\n") + "\n"); }
}
export function syncProject(repo: string, p: Project, ws: string, check = false): string[] {
  const changes: string[] = []; const side = projectState(repo, p); const targets = checkouts(p, ws);
  if (!targets.length) return changes;
  const mem = memoryDir(repo, p); if (!existsSync(mem) && !check) mkdirSync(mem, { recursive: true });
  const previously = loadState(p);
  const all = new Set<string>(sideRels(side)); for (const t of targets) for (const r of managedRels(t)) all.add(r); all.add(SETTINGS_LOCAL);
  const final = new Set<string>();
  for (const rel of [...all].sort()) {
    const sp = join(side, rel); const sideExists = existsSync(sp) && statSync(sp).isFile();
    const sideData = sideExists ? normalize(rel, readFileSync(sp)) : undefined; const sideMtime = sideExists ? statSync(sp).mtimeMs / 1000 : -1;
    let best = sideData, bestM = sideMtime, from = "project state";
    for (const t of targets) { const tp = join(t, rel); if (existsSync(tp) && statSync(tp).isFile()) { const d = normalize(rel, readFileSync(tp)); const mt = statSync(tp).mtimeMs / 1000;
      if ((!best || !d.equals(best)) && mt > bestM + 1e-6) { best = d; bestM = mt; from = contract(t); } } }
    if (!sideExists && previously.has(rel) && rel !== SETTINGS_LOCAL) {
      for (const t of targets) { const tp = join(t, rel); if (existsSync(tp)) { changes.push(`remove ${rel} from ${contract(t)} (deleted in project state)`); if (!check) unlinkSync(tp); } }
      continue;
    }
    if (best === undefined) { if (rel === SETTINGS_LOCAL) { best = Buffer.alloc(0); bestM = sideMtime; } else continue; }
    if ((!sideData || !best.equals(sideData)) && (best.length || rel !== SETTINGS_LOCAL)) { changes.push(`project state ← ${rel} (from ${from})`); if (!check) write(sp, best, bestM > 0 ? bestM : undefined); }
    if (best.length || rel !== SETTINGS_LOCAL) final.add(rel);
    for (const t of targets) { const tp = join(t, rel); const want = localize(rel, best, mem); const have = existsSync(tp) && statSync(tp).isFile() ? readFileSync(tp) : undefined;
      if (!have || !have.equals(want)) { changes.push(`${contract(t)}/${rel} ← project state`); if (!check) write(tp, want, bestM > 0 ? bestM : undefined); } }
  }
  for (const t of targets) ensureExclude(t, check, changes);
  if (!check) saveState(p, final);
  return changes;
}
export function runLink(repo: string, m: Machine, man: Manifest, names: string[] = [], check = false): number {
  const ws = workspace(man, m);
  const unknown = names.filter((n) => !man.projects[n]); if (unknown.length) throw new Error(`cs: unknown project(s): ${unknown.join(", ")}`);
  let total = 0;
  if (!names.length && !check) for (const c of sweepRemoved(man, ws)) { ui.step(c); total++; }
  for (const p of selectedProjects(man, m)) { if (names.length && !names.includes(p.name)) continue; if (!checkouts(p, ws).length) continue;
    const ch = syncProject(repo, p, ws, check); for (const c of ch) check ? ui.info(`${p.name}: ${c}`) : ui.step(`${p.name}: ${c}`); total += ch.length; }
  if (!total) ui.ok("project files in sync");
  return total;
}
