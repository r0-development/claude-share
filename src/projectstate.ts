/** Project state (see CONTEXT.md): <share>/projects/<name>/ ⇄ every directory of the project's checkout here (the root and
 *  each worktree), newer wins per file. The auto-memory pointer in .claude/settings.local.json is this machine's: injected
 *  on the way into a checkout, stripped on the way back, so the share stays machine-independent.
 *
 *  Three steps behind one silent entry point: `observe` (per-file stamps on the share side and in every checkout directory,
 *  plus what was placed last time), `decide` (pure: what goes to the share, what to which directory, what is removed, which
 *  exclude lines are missing), `write` (does it — or under `check` only says so — and returns the change lines). The
 *  module's second concern, the record of what was placed and the sweep that takes the pointer back out of a checkout
 *  whose project left the share, takes the same steps with `stripped` as its decision. Nothing here prints: quiet or not is
 *  the caller's ui.group. */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, unlinkSync, utimesSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import * as git from "./git.js";
import { contract, stateDir } from "./paths.js";
import type { Project } from "./manifest.js";
import { selectedProjects, workspace, type Share } from "./share.js";
import { checkoutRoot, dirs, dirsAt, sniff } from "./checkout.js";
import { dumps } from "./jsonmerge.js";

const ROOT_FILES = ["CLAUDE.md", "CLAUDE.local.md", ".mcp.json"];
const SKIP_UNDER_CLAUDE = new Set(["worktrees", "plans", "settings.json"]);
const EXCLUDE_LINES = [".claude/", ".mcp.json", "CLAUDE.md", "CLAUDE.local.md"];
const SETTINGS_LOCAL = ".claude/settings.local.json";
const NOT_SYNCED = new Set(["memory", "secrets"]);
const POINTER = "autoMemoryDirectory";

// ---------------------------------------------------------------- where project state lives in the share
export const statesDir = (share: Share) => join(share.path, "projects");
export const projectState = (share: Share, name: string) => join(statesDir(share), name);
export const memoryDir = (share: Share, name: string) => join(projectState(share, name), "memory");

// ---------------------------------------------------------------- observe
/** One file on one side: its content with the pointer stripped (what newer-wins compares) and its mtime in seconds. */
export interface Stamp { data: Buffer; mtime: number }
/** A file in a checkout directory also keeps the bytes on disk: the pointer is part of what must be right there. */
export interface OnDisk extends Stamp { raw: Buffer }
export interface Observation {
  side: Record<string, Stamp>;                        // the project state, rel → stamp (memory and secrets are not placed)
  targets: Record<string, Record<string, OnDisk>>;    // checkout directory → rel → stamp, managed files only
  remembered: string[];                               // rels placed last time: one gone from the side since is a deletion
  pointer: string;                                    // what to inject: this machine's path to the memory dir, as settings.local.json spells it
  excludes: { file: string; target: string; text: string }[];   // .git/info/exclude of each repo (worktrees share one), as it is
}
function walk(dir: string, fn: (f: string) => void, skipDir?: (rel: string) => boolean, base = dir) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name); const rel = relative(base, f);
    if (e.isDirectory()) { if (!skipDir?.(rel)) walk(f, fn, skipDir, base); } else if (e.isFile()) fn(rel);
  }
}
/** The files cs manages in a checkout directory: the root files and .claude/ minus what is that machine's (worktrees, plans, settings.json). */
function managedRels(base: string): Set<string> {
  const rels = new Set<string>();
  for (const f of ROOT_FILES) if (existsSync(join(base, f)) && statSync(join(base, f)).isFile()) rels.add(f);
  walk(join(base, ".claude"), (rel) => { if (rel !== "settings.json") rels.add(".claude/" + rel); }, (rel) => SKIP_UNDER_CLAUDE.has(rel.split("/")[0]));
  return rels;
}
function sideRels(side: string): Set<string> { const rels = new Set<string>(); walk(side, (rel) => rels.add(rel), (rel) => NOT_SYNCED.has(rel.split("/")[0])); return rels; }
/** settings.local.json without the pointer: the rest of it and whether the pointer was there; undefined when it is not a JSON object. */
function withoutPointer(raw: Buffer): { rest: Record<string, unknown>; had: boolean } | undefined {
  let d: unknown; try { d = JSON.parse(raw.toString("utf8") || "{}"); } catch { return undefined; }
  if (!d || typeof d !== "object") return undefined;
  const rest = d as Record<string, unknown>; const had = POINTER in rest; delete rest[POINTER]; return { rest, had };
}
function normalize(rel: string, data: Buffer): Buffer {
  if (rel !== SETTINGS_LOCAL) return data;
  const w = withoutPointer(data); return w ? Buffer.from(Object.keys(w.rest).length ? dumps(w.rest) : "") : data;
}
function localize(rel: string, data: Buffer, pointer: string): Buffer {
  if (rel !== SETTINGS_LOCAL) return data;
  let d: Record<string, unknown> = {}; try { d = data.toString("utf8").trim() ? JSON.parse(data.toString("utf8")) : {}; } catch {}
  d[POINTER] = pointer; return Buffer.from(dumps(d));
}
export function observe(side: string, targets: string[], remembered: Iterable<string>, pointer: string): Observation {
  const stampOf = (f: string, rel: string): OnDisk => { const raw = readFileSync(f); return { data: normalize(rel, raw), raw, mtime: statSync(f).mtimeMs / 1000 }; };
  const o: Observation = { side: {}, targets: {}, remembered: [...remembered], pointer, excludes: [] };
  for (const rel of sideRels(side)) { const { data, mtime } = stampOf(join(side, rel), rel); o.side[rel] = { data, mtime }; }
  const seen = new Set<string>();
  for (const t of targets) {
    o.targets[t] = {}; for (const rel of managedRels(t)) o.targets[t][rel] = stampOf(join(t, rel), rel);
    if (!git.isRepo(t)) continue; const file = git.infoExclude(t); if (seen.has(file)) continue; seen.add(file);
    o.excludes.push({ file, target: t, text: existsSync(file) ? readFileSync(file, "utf8") : "" });
  }
  return o;
}

// ---------------------------------------------------------------- decide (pure)
export interface Decisions {
  toSide: { rel: string; data: Buffer; mtime: number; from: string }[];       // newer content into the project state, from that directory
  toTargets: { target: string; rel: string; data: Buffer; mtime: number }[];  // into a checkout directory, pointer included
  removals: { target: string; rel: string }[];                                // deleted in the project state → gone from the directory
  excludes: { file: string; target: string; missing: string[]; text: string }[];   // info/exclude lines to add, and the file's new text
  placed: string[];                                                           // what the record remembers after this run
}
export function decide(o: Observation): Decisions {
  const d: Decisions = { toSide: [], toTargets: [], removals: [], excludes: [], placed: [] };
  const targets = Object.keys(o.targets); const remembered = new Set(o.remembered);
  const rels = new Set<string>([...Object.keys(o.side), SETTINGS_LOCAL]); for (const t of targets) for (const rel of Object.keys(o.targets[t])) rels.add(rel);
  for (const rel of [...rels].sort()) {
    const side = o.side[rel];
    let best = side?.data, mtime = side?.mtime ?? -1, from = "";
    for (const t of targets) { const s = o.targets[t][rel]; if (s && (!best || !s.data.equals(best)) && s.mtime > mtime + 1e-6) { best = s.data; mtime = s.mtime; from = t; } }
    if (!side && remembered.has(rel) && rel !== SETTINGS_LOCAL) {   // deleted in the project state since it was placed: the deletion travels, whatever a checkout did to its copy
      for (const t of targets) if (o.targets[t][rel]) d.removals.push({ target: t, rel });
      continue;
    }
    if (!best) { if (rel !== SETTINGS_LOCAL) continue; best = Buffer.alloc(0); }
    const substantive = best.length > 0 || rel !== SETTINGS_LOCAL;   // a settings.local.json that is only the pointer is this machine's, not the share's
    if (substantive && (!side || !best.equals(side.data))) d.toSide.push({ rel, data: best, mtime, from });
    if (substantive) d.placed.push(rel);
    const want = localize(rel, best, o.pointer);
    for (const t of targets) { const have = o.targets[t][rel]?.raw; if (!have || !have.equals(want)) d.toTargets.push({ target: t, rel, data: want, mtime }); }
  }
  for (const e of o.excludes) {
    const missing = EXCLUDE_LINES.filter((l) => !e.text.split("\n").includes(l)); if (!missing.length) continue;
    d.excludes.push({ file: e.file, target: e.target, missing, text: e.text + (!e.text || e.text.endsWith("\n") ? "" : "\n") + "# claude-share managed files\n" + missing.join("\n") + "\n" });
  }
  return d;
}

// ---------------------------------------------------------------- write
function put(path: string, data: Buffer, mtime: number) {
  mkdirSync(dirname(path), { recursive: true }); const tmp = path + ".cs-tmp"; writeFileSync(tmp, data);
  if (mtime > 0) utimesSync(tmp, mtime, mtime); renameSync(tmp, path);
}
/** Carry the decisions out (under `check`: only say what they are). One line per change, in the order a reader expects: per file, then the excludes. */
export function write(side: string, memory: string, d: Decisions, check = false): string[] {
  const lines: string[] = [];
  if (!check && !existsSync(memory)) mkdirSync(memory, { recursive: true });   // the pointer must point at something
  const rels = [...new Set([...d.removals, ...d.toSide, ...d.toTargets].map((x) => x.rel))].sort();
  for (const rel of rels) {
    for (const r of d.removals) if (r.rel === rel) { lines.push(`remove ${rel} from ${contract(r.target)} (deleted in project state)`); if (!check) unlinkSync(join(r.target, rel)); }
    for (const s of d.toSide) if (s.rel === rel) { lines.push(`project state ← ${rel} (from ${contract(s.from)})`); if (!check) put(join(side, rel), s.data, s.mtime); }
    for (const t of d.toTargets) if (t.rel === rel) { lines.push(`${contract(t.target)}/${rel} ← project state`); if (!check) put(join(t.target, rel), t.data, t.mtime); }
  }
  for (const e of d.excludes) { lines.push(`exclude ${e.missing.join(", ")} in ${contract(e.target)}`); if (!check) { mkdirSync(dirname(e.file), { recursive: true }); writeFileSync(e.file, e.text); } }
  return lines;
}

// ---------------------------------------------------------------- the record of what was placed
/** Per project, which files the project state placed last time (so a file deleted from the state is removed from the
 *  checkouts) and where the checkout was (so the sweep knows where to look once the manifest entry is gone). */
interface PlacedRecord { root?: string; files: string[] }
const recordsDir = () => join(stateDir(), "project-state");
const recordFile = (name: string) => join(recordsDir(), `${name}.json`);
function loadRecord(name: string): PlacedRecord { try { const r = JSON.parse(readFileSync(recordFile(name), "utf8")); return { root: r.root, files: r.files ?? [] }; } catch { return { files: [] }; } }
function saveRecord(name: string, root: string, files: string[]) { mkdirSync(recordsDir(), { recursive: true }); writeFileSync(recordFile(name), JSON.stringify({ root, files: [...files].sort() }, null, 2)); }
const records = (): string[] => (existsSync(recordsDir()) ? readdirSync(recordsDir()).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)) : []);

/** What a checkout's settings.local.json becomes without the pointer cs wrote: undefined when there is nothing to do (no
 *  file, not JSON, no pointer), null when the file goes (nothing else was in it), else its new content. */
export function stripped(raw: Buffer | undefined): Buffer | null | undefined {
  const w = raw && withoutPointer(raw); if (!w?.had) return undefined;
  return Object.keys(w.rest).length ? Buffer.from(dumps(w.rest)) : null;
}
/** Strip the pointer from each directory and drop the project's record. One line per directory changed. */
function unplace(name: string, checkouts: string[], why: string, check: boolean): string[] {
  const lines: string[] = [];
  for (const c of checkouts) {
    const f = join(c, SETTINGS_LOCAL); const next = stripped(existsSync(f) ? readFileSync(f) : undefined); if (next === undefined) continue;
    lines.push(`${name}: auto-memory pointer removed from ${contract(c)}${why}`); if (check) continue;
    next === null ? unlinkSync(f) : writeFileSync(f, next);
  }
  if (!check) rmSync(recordFile(name), { force: true });
  return lines;
}

// ---------------------------------------------------------------- the entry points (silent: lines come back, the caller prints)
/** Place one project's state into its checkout here — every directory of it — with newer content flowing back. `[]` when
 *  the project has no checkout on this machine. Lines are not prefixed with the project's name. */
export function place(share: Share, p: Project, o: { check?: boolean } = {}): string[] {
  const ws = workspace(share); const targets = dirs(p, ws); if (!targets.length) return [];
  const side = projectState(share, p.name), memory = memoryDir(share, p.name);
  const d = decide(observe(side, targets, loadRecord(p.name).files, contract(memory)));
  const lines = write(side, memory, d, o.check);
  if (!o.check) saveRecord(p.name, checkoutRoot(p, ws), d.placed);
  return lines;
}
/** Every selected project with a checkout here, after the sweep — or, with `names`, just those (no sweep; an unknown name
 *  throws). Lines are `<project>: <change>`. */
export function placeAll(share: Share, o: { check?: boolean; names?: string[] } = {}): string[] {
  const names = o.names ?? [];
  const unknown = names.filter((n) => !share.manifest.projects[n]); if (unknown.length) throw new Error(`cs: unknown project(s): ${unknown.join(", ")}`);
  const lines = names.length ? [] : sweep(share, { check: o.check });
  for (const p of selectedProjects(share)) if (!names.length || names.includes(p.name)) for (const l of place(share, p, o)) lines.push(`${p.name}: ${l}`);
  return lines;
}
/** A record whose name is no longer in the manifest means the project was removed from the share (cs remove on another
 *  machine): the pointer comes out of the checkout the record names (its worktrees included) and the record goes. A record
 *  from before roots were recorded falls back to the default location, plain or `<name>/repo`. */
export function sweep(share: Share, o: { check?: boolean } = {}): string[] {
  const lines: string[] = []; const ws = workspace(share);
  for (const name of records()) {
    if (share.manifest.projects[name]) continue;
    const root = loadRecord(name).root || sniff(join(ws, name)).root;
    lines.push(...unplace(name, dirsAt(root), " (project removed from the share)", o.check ?? false));
  }
  return lines;
}
/** cs remove's tidy-up inside the checkouts it leaves behind: the pointer goes, nothing else is touched; the record goes. */
export const forget = (name: string, checkouts: string[]): string[] => unplace(name, checkouts, "", false);
