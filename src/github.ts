/** GitHub REST API with a per-owner fine-grained token (no gh CLI). Tokens: ~/.config/claude-share/tokens/<owner>. */
import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { csConfigDir } from "./paths.js";
import * as ui from "./ui.js";

export class GitHubError extends Error {}
export const tokenFile = (owner: string) => join(csConfigDir(), "tokens", owner.toLowerCase());
export function getToken(owner: string): string | undefined {
  const env = process.env[`CS_GITHUB_TOKEN_${owner.toUpperCase().replace(/-/g, "_")}`];
  if (env) return env.trim();
  const f = tokenFile(owner);
  return existsSync(f) ? readFileSync(f, "utf8").trim() || undefined : undefined;
}
export async function setToken(owner: string, token?: string) {
  token ||= await ui.password(`GitHub fine-grained token for '${owner}' (Administration r/w on all repos)`);
  if (!token) throw new Error("cs: empty token");
  const f = tokenFile(owner);
  mkdirSync(join(csConfigDir(), "tokens"), { recursive: true, mode: 0o700 });
  writeFileSync(f, token + "\n"); chmodSync(f, 0o600);
  return f;
}
export function rmToken(owner: string) { const f = tokenFile(owner); if (existsSync(f)) unlinkSync(f); }
export async function api<T = any>(method: string, path: string, token: string, body?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await fetch("https://api.github.com" + path, { method, headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "claude-share", ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
  } catch (e: any) { throw new GitHubError(`GitHub unreachable: ${e?.message ?? e}`); }
  const text = await r.text();
  if (!r.ok) { let msg = ""; try { msg = JSON.parse(text).message ?? ""; } catch {} throw new GitHubError(`GitHub ${method} ${path}: ${r.status} ${msg}`.trim()); }
  return text ? JSON.parse(text) : ({} as T);
}
export const whoami = async (t: string) => (await api("GET", "/user", t)).login as string;
export const ownerType = async (o: string, t: string) => (await api("GET", `/users/${o}`, t)).type as "User" | "Organization";
export async function repoExists(o: string, n: string, t: string) {
  try { await api("GET", `/repos/${o}/${n}`, t); return true; } catch (e) { if (String(e).includes(" 404")) return false; throw e; }
}
export async function createRepo(o: string, n: string, t: string, priv = true, description = "") {
  const body = { name: n, private: priv, description, auto_init: false };
  if ((await ownerType(o, t)) === "Organization") return api("POST", `/orgs/${o}/repos`, t, body);
  const me = await whoami(t);
  if (me.toLowerCase() !== o.toLowerCase()) throw new GitHubError(`token belongs to '${me}', cannot create repos for user '${o}'`);
  return api("POST", "/user/repos", t, body);
}
export async function ensureToken(owner: string, interactive = true): Promise<string> {
  const t = getToken(owner);
  if (t) return t;
  if (!interactive) throw new GitHubError(`no GitHub token for '${owner}' — run cs token set ${owner}`);
  await setToken(owner);
  const tok = getToken(owner)!;
  const me = await whoami(tok);
  if ((await ownerType(owner, tok)) === "User" && me.toLowerCase() !== owner.toLowerCase()) throw new GitHubError(`token authenticates as '${me}', not '${owner}'`);
  return tok;
}
export async function ensureRepo(o: string, n: string, t: string, priv = true, description = "") {
  if (await repoExists(o, n, t)) return false;
  await createRepo(o, n, t, priv, description);
  return true;
}
