/** The master key ~/.ssh/cs/master: one per machine, used ONLY to reach the config repo (deploy key). */
import { chmodSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import * as git from "./git.js";
import * as github from "./github.js";
import { expand, nodename } from "./paths.js";
import * as ui from "./ui.js";

export const KEY = "~/.ssh/cs/master";
export const keyPath = () => expand(KEY);
export function ensureKey(machine = ""): { key: string; pub: string; created: boolean } {
  const key = keyPath(), pubf = key + ".pub";
  if (existsSync(key) && existsSync(pubf)) return { key, pub: readFileSync(pubf, "utf8").trim(), created: false };
  mkdirSync(dirname(key), { recursive: true, mode: 0o700 });
  const p = spawnSync("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", `cs:${machine || nodename()}:master`, "-f", key]);
  if (p.status !== 0) throw new Error("cs: ssh-keygen failed"); chmodSync(key, 0o600);
  return { key, pub: readFileSync(pubf, "utf8").trim(), created: true };
}
/** Any pasted form → [ssh url, [owner, repo] | undefined]. */
export function parseRepoUrl(text: string): [string, [string, string] | undefined] {
  const t = text.trim().replace(/\/+$/, "");
  const m = t.match(/^(?:https?:\/\/|ssh:\/\/git@|git@)?(?:www\.)?github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
  return m ? [`git@github.com:${m[1]}/${m[2]}.git`, [m[1], m[2]]] : [t, undefined];
}
export const httpsUrl = (o: string, r: string) => `https://github.com/${o}/${r}.git`;
export function isPublic(url: string): boolean | undefined {
  if (!url.startsWith("https://") || process.env.CS_OFFLINE) return undefined;
  const p = spawnSync("git", ["ls-remote", "--exit-code", url, "HEAD"], { encoding: "utf8", env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }, timeout: 30000, stdio: ["ignore", "pipe", "pipe"] });
  if (p.status === 0) return true;
  return /Authentication failed|could not read Username|Repository not found/.test(p.stderr ?? "") ? false : undefined;
}
export function canAccess(sshUrl: string): [boolean, string] {
  const p = spawnSync("git", ["ls-remote", sshUrl, "HEAD"], { encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, GIT_SSH_COMMAND: `ssh -i ${keyPath()} -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=accept-new` } });
  return [p.status === 0, (p.stderr ?? "").trim().split("\n").pop() ?? ""];
}
export async function registerDeployKey(owner: string, repo: string, pub: string, title: string): Promise<string | undefined> {
  const tok = github.getToken(owner); if (!tok || process.env.CS_OFFLINE) return undefined;
  try { const keys = await github.api<any[]>("GET", `/repos/${owner}/${repo}/keys`, tok);
    if (keys.some((k) => (k.key ?? "").split(" ").slice(0, 2).join(" ") === pub.split(" ").slice(0, 2).join(" "))) return "already a deploy key";
    await github.api("POST", `/repos/${owner}/${repo}/keys`, tok, { title, key: pub, read_only: false }); return "registered as deploy key (write)";
  } catch (e: any) { return `could not register via API: ${e.message}`; }
}
export function instructions(pub: string, gh?: [string, string]) {
  const lines: string[] = [];
  if (gh) lines.push(`deploy key with write access (recommended): ${ui.cyan(`https://github.com/${gh[0]}/${gh[1]}/settings/keys/new`)}`, `or your account's SSH keys:                 ${ui.cyan("https://github.com/settings/ssh/new")}`, "");
  lines.push(ui.bold(pub), "", ui.dim("this master key only reaches the config repo; it is separate from your identities"));
  ui.note(lines, "Add this machine's master public key to the config repo");
}
export const configureRepo = (repoDir: string) => git.git(["config", "core.sshCommand", `ssh -i ${KEY} -o IdentitiesOnly=yes`], repoDir);
export async function setup(repoDir: string, interactive = true): Promise<number> {
  const url = git.remoteUrl(repoDir); if (!url) { ui.warn("config repo has no remote"); return 1; }
  const [sshUrl, gh] = parseRepoUrl(url); const { pub, created } = ensureKey();
  ui.kv("master key", KEY + (created ? "  (generated)" : ""));
  let [ok] = canAccess(sshUrl);
  if (!ok && gh) { const reg = await registerDeployKey(gh[0], gh[1], pub, "cs:master"); if (reg) { ui.info(reg); [ok] = canAccess(sshUrl); } }
  while (!ok) { instructions(pub, gh); if (!interactive || (await ui.waitEnter("press Enter when the key is added", "q")) === "q") return 1; [ok] = canAccess(sshUrl); }
  if (sshUrl !== url) git.git(["remote", "set-url", "origin", sshUrl], repoDir);
  configureRepo(repoDir); ui.ok(`config repo uses the master key (${sshUrl})`); return 0;
}
