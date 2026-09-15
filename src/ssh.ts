/** cs ssh setup|check: per-machine identity keys ~/.ssh/cs/<id>. */
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import * as git from "./git.js";
import * as github from "./github.js";
import { expand, home, contract } from "./paths.js";
import * as platform from "./platform.js";
import type { Machine } from "./config.js";
import { keyPath, type Identity, type Manifest } from "./manifest.js";
import * as ui from "./ui.js";

const MARK = "# >>> claude-share >>>", END = "# <<< claude-share <<<";
function keygen(key: string, comment: string) { mkdirSync(dirname(key), { recursive: true, mode: 0o700 }); const p = spawnSync("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", comment, "-f", key]); if (p.status !== 0) throw new Error("cs: ssh-keygen failed"); chmodSync(key, 0o600); }
export function githubUserForKey(key: string): string | undefined {
  if (process.env.CS_OFFLINE) return undefined;
  const p = spawnSync("ssh", ["-T", "-i", key, "-o", "IdentitiesOnly=yes", "-o", "StrictHostKeyChecking=accept-new", "-o", "BatchMode=yes", "git@github.com"], { encoding: "utf8", timeout: 20000, stdio: ["ignore", "pipe", "pipe"] });
  return ((p.stdout ?? "") + (p.stderr ?? "")).match(/Hi ([^!]+)!/)?.[1];
}
export function writeSshConfig(): boolean {
  const cfg = join(home(), ".ssh", "config"); const text = existsSync(cfg) ? readFileSync(cfg, "utf8") : "";
  const block = [MARK, "Host github.com", "    IdentitiesOnly yes", "    AddKeysToAgent yes", ...(platform.isMac() ? ["    UseKeychain yes"] : []), END].join("\n") + "\n";
  const next = text.includes(MARK) ? text.slice(0, text.indexOf(MARK)) + block + text.slice(text.indexOf(END) + END.length + 1) : block + (text && !text.startsWith("\n") ? "\n" : "") + text;
  if (next === text) return false; mkdirSync(dirname(cfg), { recursive: true, mode: 0o700 }); writeFileSync(cfg, next); chmodSync(cfg, 0o600); return true;
}
async function register(i: Identity, pub: string, title: string): Promise<string> {
  if (process.env.CS_OFFLINE) return "offline"; if (!i.owner) return "no owner; add the key manually";
  const tok = github.getToken(i.owner); if (!tok) return `no token for ${i.owner}; add manually: https://github.com/settings/ssh/new`;
  try { if ((await github.ownerType(i.owner, tok)) !== "User") return `${i.owner} is an organization — add the key to the user account that belongs to it: https://github.com/settings/ssh/new`;
    const keys = await github.api<any[]>("GET", "/user/keys", tok); if (keys.some((k) => (k.key ?? "").split(" ").slice(0, 2).join(" ") === pub.split(" ").slice(0, 2).join(" "))) return "already registered on GitHub";
    await github.api("POST", "/user/keys", tok, { title, key: pub }); return "registered on GitHub";
  } catch (e: any) { return /403|404/.test(e.message) ? "token lacks 'Git SSH keys: write' — add manually: https://github.com/settings/ssh/new" : e.message; }
}
export async function setup(repo: string, m: Machine, man: Manifest, checkOnly = false): Promise<number> {
  const ids = Object.values(man.identities); if (!ids.length) { ui.warn("no identities yet (cs identity add …)"); return 0; }
  const rows: string[][] = []; let published = false; const unregistered: Identity[] = [];
  for (const i of ids) {
    const key = expand(keyPath(i)), pubf = key + ".pub"; const state: string[] = [];
    if (!existsSync(key)) { if (checkOnly) { rows.push([i.id, keyPath(i), ui.red("missing")]); unregistered.push(i); continue; } keygen(key, `cs:${m.name}:${i.id}`); state.push(ui.green("generated")); }
    const pub = readFileSync(pubf, "utf8").trim(); const dest = join(repo, "machines", m.name, "ssh", `${i.id}.pub`);
    if (!checkOnly && (!existsSync(dest) || readFileSync(dest, "utf8").trim() !== pub)) { mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, pub + "\n"); git.git(["add", dest], repo); published = true; }
    let user = await ui.spin(`verifying ${i.id} key on GitHub…`, async () => githubUserForKey(key));
    if (user) state.push(ui.green(`github: ${user}`));
    else if (!checkOnly) { const r = await ui.spin(`registering ${i.id} key…`, async () => register(i, pub, `cs:${m.name}:${i.id}`)); user = githubUserForKey(key); if (user) state.push(ui.green(`github: ${user}`)); else { state.push(ui.yellow(r.startsWith("registered") ? "registered, not verified yet" : "needs registering")); unregistered.push(i); } }
    else { state.push(ui.yellow("not accepted by GitHub yet")); unregistered.push(i); }
    rows.push([i.id, keyPath(i), state.join("  ")]);
  }
  if (published) git.commit(repo, `machines: ${m.name} ssh public keys`, "cs", `cs@${m.name}`);
  if (!checkOnly && writeSshConfig()) ui.step("~/.ssh/config: managed block (IdentitiesOnly, AddKeysToAgent)");
  ui.table(rows, ["identity", "key", "state"]);
  for (const i of unregistered) { const pubf = expand(keyPath(i)) + ".pub"; if (!existsSync(pubf)) continue;
    const who = i.owner && i.owner.toLowerCase() !== i.id.toLowerCase() ? `the ${i.owner} account` : `your GitHub account that is a member of ${i.owner || "the org"}`;
    ui.note([`${ui.cyan("https://github.com/settings/ssh/new")}  ${ui.dim(`→ logged in as ${who}`)}`, "", `title  ${ui.bold(`cs:${m.name}:${i.id}`)}`, `key    ${ui.bold(readFileSync(pubf, "utf8").trim())}`], `Add the ${i.id} key`); }
  return unregistered.length ? 1 : 0;
}
