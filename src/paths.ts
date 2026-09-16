import { homedir, hostname } from "node:os";
import { join, resolve, isAbsolute, relative } from "node:path";

export const home = () => process.env.HOME || homedir();
export const claudeDir = () => process.env.CLAUDE_CONFIG_DIR || join(home(), ".claude");
export const claudeJson = () => join(process.env.CLAUDE_CONFIG_DIR || home(), ".claude.json");
export const csConfigDir = () => process.env.CS_CONFIG_DIR || join(home(), ".config", "claude-share");
export const machineFile = () => join(csConfigDir(), "machine.toml");
export const shareDirDefault = () => join(csConfigDir(), "repo");
export const handoffStateDir = () => join(stateDir(), "handoff");
export const stateDir = () => join(process.env.XDG_STATE_HOME || join(home(), ".local", "state"), "cs");
export const toolRoot = () => resolve(new URL(".", import.meta.url).pathname, "..");
export const templatesDir = () => join(toolRoot(), "templates");
export const nodename = () => hostname();

/** ~ and $VAR expansion against the (possibly overridden) HOME. */
export function expand(p: string): string {
  let s = p.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, v) => process.env[v] ?? "");
  if (s === "~" || s.startsWith("~/")) s = home() + s.slice(1);
  return s;
}
/** Inverse: render with ~ for the home prefix. */
export function contract(p: string): string {
  const h = home();
  if (p === h) return "~";
  if (p.startsWith(h + "/")) return "~/" + p.slice(h.length + 1);
  return p;
}
export const isUnder = (child: string, parent: string) => { const r = relative(parent, child); return !!r && !r.startsWith("..") && !isAbsolute(r); };
