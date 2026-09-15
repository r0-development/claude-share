/** Thin wrapper around git (sync spawn). */
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { join, resolve, isAbsolute } from "node:path";

export interface Res { code: number; out: string; err: string }
export function git(args: string[], cwd?: string, opts: { check?: boolean; sshKey?: string; timeout?: number; input?: string; env?: NodeJS.ProcessEnv } = {}): Res {
  const env = { ...process.env, ...(opts.env ?? {}) };
  if (opts.sshKey) env.GIT_SSH_COMMAND = `ssh -i ${opts.sshKey} -o IdentitiesOnly=yes`;
  const p = spawnSync("git", args, { cwd, env, encoding: "utf8", timeout: opts.timeout ? opts.timeout * 1000 : undefined, input: opts.input, stdio: ["pipe", "pipe", "pipe"] });
  const r = { code: p.status ?? 1, out: (p.stdout ?? "").trim(), err: (p.stderr ?? "").trim() };
  if (opts.check !== false && r.code !== 0) {
    const last = r.err.split("\n").filter(Boolean).pop() ?? "";
    throw new Error(`cs: git ${args.slice(0, 2).join(" ")} failed in ${cwd ?? "."}\n  ${last}`);
  }
  return r;
}
/** Async git for long operations (fetch/pull/push/clone/ls-remote) — keeps spinners alive. */
export async function gitA(args: string[], cwd?: string, opts: { check?: boolean; sshKey?: string; timeout?: number; env?: NodeJS.ProcessEnv } = {}): Promise<Res> {
  const { exec } = await import("./proc.js");
  const env = { ...process.env, ...(opts.env ?? {}) }; if (opts.sshKey) env.GIT_SSH_COMMAND = `ssh -i ${opts.sshKey} -o IdentitiesOnly=yes`;
  const r = await exec("git", args, { cwd, env, timeout: opts.timeout });
  if (opts.check !== false && r.code !== 0) { const last = r.err.split("\n").filter(Boolean).pop() ?? ""; throw new Error(`cs: git ${args.slice(0, 2).join(" ")} failed in ${cwd ?? "."}\n  ${last}`); }
  return r;
}
export const out = (args: string[], cwd?: string, dflt = "") => { const r = git(args, cwd, { check: false }); return r.code === 0 ? r.out : dflt; };
export const isRepo = (p: string) => existsSync(join(p, ".git"));
export const isBare = (p: string) => existsSync(join(p, "HEAD")) && existsSync(join(p, "objects"));
export const toplevel = (p: string) => out(["rev-parse", "--show-toplevel"], p) || undefined;
export function version(): [number, number, number] {
  const v = out(["--version"]).split(" ").pop() ?? "0.0.0";
  const [a, b, c] = v.split(".").map((x) => parseInt(x, 10) || 0);
  return [a, b, c];
}
export const remoteUrl = (p: string, name = "origin") => out(["remote", "get-url", name], p);
export const currentBranch = (p: string) => out(["symbolic-ref", "--short", "-q", "HEAD"], p);
export const dirtyCount = (p: string) => { const s = out(["status", "--porcelain", "--untracked-files=normal"], p); return s ? s.split("\n").length : 0; };
export const isDirty = (p: string) => dirtyCount(p) > 0;
export function aheadBehind(p: string): [number, number] | undefined {
  const s = out(["rev-list", "--left-right", "--count", "@{upstream}...HEAD"], p);
  if (!s) return undefined;
  const [behind, ahead] = s.split(/\s+/).map((x) => parseInt(x, 10));
  return [ahead, behind];
}
export const worktrees = (p: string) => out(["worktree", "list", "--porcelain"], p).split("\n").filter((l) => l.startsWith("worktree ")).map((l) => l.slice(9));
export function commonDir(p: string) { const c = out(["rev-parse", "--git-common-dir"], p); return isAbsolute(c) ? c : resolve(p, c); }
export const infoExclude = (p: string) => join(commonDir(p), "info", "exclude");
export const configGet = (p: string, key: string) => out(["config", "--get", key], p);
/** Commit with the repo's resolved identity, or a fallback when none resolves. */
export function commit(p: string, message: string, fallbackName = "cs", fallbackEmail = "cs@localhost") {
  const pre = configGet(p, "user.email") ? [] : ["-c", `user.name=${fallbackName}`, "-c", `user.email=${fallbackEmail}`];
  git([...pre, "commit", "-q", "-m", message], p);
}
export function canonicalGithub(url: string): string {
  let u = url.trim();
  if (u.startsWith("https://github.com/")) u = "git@github.com:" + u.slice("https://github.com/".length);
  else if (u.startsWith("ssh://git@github.com/")) u = "git@github.com:" + u.slice("ssh://git@github.com/".length);
  else if (u.startsWith("git@github-") && u.includes(":")) u = "git@github.com:" + u.split(":").slice(1).join(":");
  if (!u.endsWith(".git")) u += ".git";
  return u;
}
/** Trailer values of a commit: { "Cs-Branch": "feat/x", … } */
export function trailers(p: string, sha: string): Record<string, string> {
  const t = out(["log", "-1", "--format=%(trailers:only,unfold)", sha], p); const o: Record<string, string> = {};
  for (const l of t.split("\n")) { const i = l.indexOf(":"); if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
  return o;
}
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "x";
export const exists = (p: string) => { try { statSync(p); return true; } catch { return false; } };
