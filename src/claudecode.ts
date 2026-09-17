/** Claude Code's own record of a checkout: what it keeps under ~/.claude/projects/<key>/ (auto-memory, session transcripts)
 *  and in ~/.claude.json (local-scope MCP servers), keyed by the directory a session was started in — which for one checkout
 *  can be its container, its root or any unit. Read only; cs never writes here (the auto-memory pointer that redirects
 *  memory into the share is project state's business, src/projectstate.ts). The record is looked up by where a checkout
 *  is — a Checkout, or just its places when it may be gone (cs import reads memory a deleted checkout left behind). */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { claudeDir, claudeJson, contract } from "./paths.js";
import type { Checkout } from "./checkout.js";

/** The directory name Claude Code derives from a path: every character outside [A-Za-z0-9] becomes a dash. */
export const recordKey = (path: string) => path.replace(/[^A-Za-z0-9]/g, "-");
export const recordDir = (path: string) => join(claudeDir(), "projects", recordKey(path));
/** Where a checkout is, as far as the record cares: a Checkout has it; src/checkout.ts's `places` gives it cheaply, present or not. */
export type Places = Pick<Checkout, "container" | "root"> & { units: { path: string }[] };
/** Every directory the checkout may be keyed under: the container, the root and each unit — one checkout, several records. */
export const keyedPaths = (c: Places): string[] => [...new Set([c.container, c.root, ...c.units.map((u) => u.path)])];

/** The auto-memory directories that exist for the checkout (before cs pointed memory into the share, each record had its own). */
export const memoryDirs = (c: Places): string[] => keyedPaths(c).map((p) => join(recordDir(p), "memory")).filter((d) => existsSync(d));

export interface Transcript { file: string; ended: string }
/** The newest session transcript over `paths`; `ended` is its last write. */
function newest(paths: string[]): Transcript | undefined {
  let best: { file: string; mtime: number } | undefined;
  for (const p of paths) {
    const dir = recordDir(p); if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) { if (!f.endsWith(".jsonl")) continue; const mtime = statSync(join(dir, f)).mtimeMs; if (!best || mtime > best.mtime) best = { file: join(dir, f), mtime }; }
  }
  return best && { file: best.file, ended: new Date(best.mtime).toISOString() };
}
/** The unit's own newest session when it has one (a worktree's sessions are its own), else the checkout's newest. */
export const latestTranscript = (c: Places, unit?: { path: string }): Transcript | undefined => (unit && newest([unit.path])) || newest(keyedPaths(c));

/** ~/.claude.json's local-scope MCP servers for the checkout, by name; the first keyed path to name a server wins.
 *  No file is no servers; a file that is not JSON is an error (the answer would otherwise be a misleading "none"). */
export function localMcp(c: Places): Record<string, any> {
  if (!existsSync(claudeJson())) return {};
  let data: any; try { data = JSON.parse(readFileSync(claudeJson(), "utf8")); } catch { throw new Error(`cs: ${contract(claudeJson())} is not valid JSON`); }
  const found: Record<string, any> = {};
  for (const p of keyedPaths(c)) for (const [n, cfg] of Object.entries<any>(data?.projects?.[p]?.mcpServers ?? {})) found[n] ??= cfg;
  return found;
}
