/** cs doctor [--fix]: environment and consistency checks. */
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as git from "./git.js";
import { claudeDir, claudeJson, contract } from "./paths.js";
import * as platform from "./platform.js";
import type { Machine } from "./config.js";
import { checkoutRoot, identityMatches, selectedProjects, workspace, type Manifest } from "./manifest.js";
import { applySettings } from "./apply.js";
import * as ui from "./ui.js";
import { which } from "./deps.js";

type R = ["ok" | "warn" | "fail", string];
const LINKS = ["CLAUDE.md", "rules", "agents", "themes", "keybindings.json", "plans"];

export function fix(repo: string, m: Machine, man: Manifest) {
  const ws = workspace(man, m);
  for (const p of selectedProjects(man, m)) {
    const root = checkoutRoot(p, ws); if (p.kind !== "git" || !existsSync(root) || !git.isRepo(root) || !p.url) continue;
    const url = git.remoteUrl(root); if (url === p.url) continue;
    const cur = git.canonicalGithub(url), want = git.canonicalGithub(p.url);
    let same = cur === want; const ident = p.identity ? man.identities[p.identity] : undefined;
    if (!same && ident && identityMatches(ident, cur) && cur.split("/").pop() === want.split("/").pop()) same = true;
    if (same) { git.git(["remote", "set-url", "origin", p.url], root); ui.ok(`${p.name}: remote url ${url} → ${p.url}`); }
    else ui.warn(`${p.name}: remote ${url} is a different repo than manifest ${p.url}; not changing it`);
  }
}
export function runDoctor(repo: string, m: Machine, man: Manifest, doFix = false): number {
  if (doFix) fix(repo, m, man);
  const res: R[] = [];
  platform.refuseUnsupported(); res.push(["ok", platform.describe()]);
  res.push(["ok", `node ${process.versions.node}`]);
  const v = git.version(); res.push(v[0] > 2 || (v[0] === 2 && v[1] >= 36) ? ["ok", `git ${v.join(".")}`] : ["warn", `git ${v.join(".")} < 2.36: identities fall back to per-repo config`]);
  res.push(which("claude") ? ["ok", `claude at ${which("claude")}`] : ["warn", "claude not on PATH (curl -fsSL https://claude.ai/install.sh | bash)"]);
  const ws = workspace(man, m); res.push(platform.isWSL() && ws.startsWith("/mnt/") ? ["fail", `workspace ${ws} is on the Windows filesystem; use the WSL home`] : ["ok", `workspace ${contract(ws)}`]);
  const broken = LINKS.filter((i) => { try { return lstatSync(join(claudeDir(), i)).isSymbolicLink() && !existsSync(join(claudeDir(), i)); } catch { return false; } });
  res.push(broken.length ? ["fail", "broken links in ~/.claude: " + broken.join(", ") + "  (cs apply)"] : ["ok", "~/.claude links healthy"]);
  const ch: string[] = []; applySettings(repo, m, true, ch); res.push(ch.length ? ["warn", "settings.json drift: " + ch.join("; ") + "  (cs apply)"] : ["ok", "settings.json rendered"]);
  if (existsSync(claudeJson())) { try { const d = JSON.parse(readFileSync(claudeJson(), "utf8")); const hits: string[] = [];
    for (const [path, e] of Object.entries<any>(d.projects ?? {})) for (const [n, c] of Object.entries<any>(e.mcpServers ?? {})) if (c.env || c.headers) hits.push(`${n}@${contract(path)}`);
    res.push(hits.length ? ["warn", `local-scope MCP servers with secrets in ~/.claude.json (machine-only): ${hits.join(", ")} — keep until cs secrets provides the \${VAR}s, then \`claude mcp remove <name> -s local\``] : ["ok", "no secret-bearing local-scope MCP servers"]); } catch { res.push(["warn", "~/.claude.json unparsable"]); } }
  res.push(process.env.GH_TOKEN || process.env.GITHUB_TOKEN ? ["warn", "GH_TOKEN/GITHUB_TOKEN is exported in this shell; gh ignores its stored logins while set"] : ["ok", "no GH_TOKEN override in env"]);
  const idr: R[] = [];
  for (const p of selectedProjects(man, m)) { const root = checkoutRoot(p, ws); if (p.kind !== "git" || !existsSync(root) || !git.isRepo(root)) continue;
    const ident = p.identity ? man.identities[p.identity] : undefined; const email = git.configGet(root, "user.email"); const url = git.remoteUrl(root);
    if (p.url && git.canonicalGithub(url) !== git.canonicalGithub(p.url)) idr.push(["warn", `${p.name}: remote ${url} ≠ manifest ${p.url}  (cs doctor --fix)`]);
    else if (url && p.url && url !== p.url) idr.push(["warn", `${p.name}: remote uses alias/other form ${url}; manifest ${p.url}  (cs doctor --fix)`]);
    if (ident && email !== ident.email) idr.push(["fail", `${p.name}: user.email resolves to '${email || "UNSET"}', expected ${ident.email}`]); }
  res.push(...(idr.length ? idr : [["ok", "git identities resolve per manifest"] as R]));
  const sym = { ok: ui.green("✓"), warn: ui.yellow("!"), fail: ui.red("✗") };
  ui.table(res.map(([l, msg]) => [sym[l], msg]));
  return res.some(([l]) => l === "fail") ? 1 : 0;
}
