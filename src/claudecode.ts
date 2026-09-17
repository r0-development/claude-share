/** Claude Code's own record of a checkout: what it keeps under ~/.claude/projects/<key>/ (auto-memory, session transcripts)
 *  and in ~/.claude.json (local-scope MCP servers), keyed by the directory a session was started in — which for one checkout
 *  can be its container, its root or any unit. Read only; cs never writes here (the auto-memory pointer that redirects
 *  memory into the share is project state's business, src/projectstate.ts). */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { claudeDir, claudeJson } from "./paths.js";
import type { Checkout } from "./checkout.js";

/** The directory name Claude Code derives from a path: every character outside [A-Za-z0-9] becomes a dash. */
export const key = (path: string) => path.replace(/[^A-Za-z0-9]/g, "-");
export const recordDir = (path: string) => join(claudeDir(), "projects", key(path));
/** Every directory the checkout may be keyed under: the container, the root and each unit — one checkout, several records. */
export const keyedPaths = (c: Checkout): string[] => [...new Set([c.container, c.root, ...c.units.map((u) => u.path)])];

/** The auto-memory directories that exist for the checkout (before cs pointed memory into the share, each record had its own). */
export const memoryDirs = (c: Checkout): string[] => keyedPaths(c).map((p) => join(recordDir(p), "memory")).filter((d) => existsSync(d));

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
export const latestTranscript = (c: Checkout, unit?: { path: string }): Transcript | undefined => (unit && newest([unit.path])) || newest(keyedPaths(c));

/** ~/.claude.json's local-scope MCP servers for the checkout, by name; the first keyed path to name a server wins. */
export function localMcp(c: Checkout): Record<string, any> {
  let data: any = {}; try { data = JSON.parse(readFileSync(claudeJson(), "utf8")); } catch { return {}; }
  const found: Record<string, any> = {};
  for (const p of keyedPaths(c)) for (const [n, cfg] of Object.entries<any>(data?.projects?.[p]?.mcpServers ?? {})) found[n] ??= cfg;
  return found;
}
