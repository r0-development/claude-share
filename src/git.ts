/** Thin wrapper around git: `git` (sync) for instant local queries, `gitA` (async) for anything that may wait on the network. */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve, isAbsolute } from "node:path";
import { exec } from "./proc.js";

export interface Res { code: number; out: string; err: string }
export interface GitOpts { check?: boolean; sshKey?: string; timeout?: number; input?: string; env?: NodeJS.ProcessEnv }
const envOf = (o: GitOpts) => { const env = { ...process.env, ...(o.env ?? {}) }; if (o.sshKey) env.GIT_SSH_COMMAND = `ssh -i ${o.sshKey} -o IdentitiesOnly=yes`; return env; };
/** The last non-empty line of git's stderr — the one that says why. */
export const lastLine = (err: string) => err.split("\n").filter(Boolean).pop() ?? "";
/** The result trimmed, or (with `check`, the default) an error naming the command and git's last line. */
function finish(args: string[], cwd: string | undefined, o: GitOpts, r: Res): Res {
  const res = { code: r.code, out: r.out.trim(), err: r.err.trim() };
  if (o.check !== false && res.code !== 0) throw new Error(`cs: git ${args.slice(0, 2).join(" ")} failed in ${cwd ?? "."}\n  ${lastLine(res.err)}`);
  return res;
}
/** Instant local queries (sync spawn — blocks the event loop, so never under a spinner). */
export function git(args: string[], cwd?: string, o: GitOpts = {}): Res {
  const p = spawnSync("git", args, { cwd, env: envOf(o), encoding: "utf8", timeout: o.timeout ? o.timeout * 1000 : undefined, input: o.input, stdio: ["pipe", "pipe", "pipe"] });
  return finish(args, cwd, o, { code: p.status ?? 1, out: p.stdout ?? "", err: p.stderr ?? "" });
}
/** Anything that may take a while (fetch/pull/push/clone/ls-remote) — keeps spinners alive. */
export async function gitA(args: string[], cwd?: string, o: GitOpts = {}): Promise<Res> {
  return finish(args, cwd, o, await exec("git", args, { cwd, env: envOf(o), timeout: o.timeout, input: o.input }));
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
/** Where `branch` pushes to: its configured upstream as { remote, ref } (ref is the remote-side refs/heads/… name), or undefined. */
export function upstream(p: string, branch: string): { remote: string; ref: string } | undefined {
  const remote = configGet(p, `branch.${branch}.remote`), ref = configGet(p, `branch.${branch}.merge`);
  return remote && ref ? { remote, ref } : undefined;
}
export const worktrees = (p: string) => out(["worktree", "list", "--porcelain"], p).split("\n").filter((l) => l.startsWith("worktree ")).map((l) => l.slice(9));
export function commonDir(p: string) { const c = out(["rev-parse", "--git-common-dir"], p); return isAbsolute(c) ? c : resolve(p, c); }
export const infoExclude = (p: string) => join(commonDir(p), "info", "exclude");
export const configGet = (p: string, key: string) => out(["config", "--get", key], p);
/** `-c user.*` arguments for commands that create commits when no identity resolves in `p` (commit, rebase --continue). */
export const identityArgs = (p: string, fallbackName = "cs", fallbackEmail = "cs@localhost") => (configGet(p, "user.email") ? [] : ["-c", `user.name=${fallbackName}`, "-c", `user.email=${fallbackEmail}`]);
/** Commit with the repo's resolved identity, or a fallback when none resolves. */
export function commit(p: string, message: string, fallbackName = "cs", fallbackEmail = "cs@localhost") {
  git([...identityArgs(p, fallbackName, fallbackEmail), "commit", "-q", "-m", message], p);
}
export const rebaseInProgress = (p: string) => existsSync(join(commonDir(p), "rebase-merge")) || existsSync(join(commonDir(p), "rebase-apply"));
/** "3/5" — which commit a stopped rebase is replaying (empty when no rebase is in progress). */
export function rebaseStep(p: string): string {
  const read = (f: string) => { try { return readFileSync(join(commonDir(p), "rebase-merge", f), "utf8").trim(); } catch { return ""; } };
  return read("msgnum") ? `${read("msgnum")}/${read("end")}` : "";
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
/** Files changed in the working tree: modified against HEAD plus untracked (not ignored), each once, sorted. */
export const changedFiles = (dir: string) => [...new Set([...out(["diff", "--name-only", "HEAD"], dir).split("\n"), ...out(["ls-files", "-o", "--exclude-standard"], dir).split("\n")].filter(Boolean))].sort();
