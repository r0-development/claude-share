/** cs doctor [--fix]: environment and consistency checks. */
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as git from "./git.js";
import { claudeDir, claudeJson, contract } from "./paths.js";
import * as platform from "./platform.js";
import type { Machine } from "./machine.js";
import { identityMatches, loadManifest, selectedProjects, workspace, type Manifest, type Project } from "./manifest.js";
import { locate, present } from "./checkout.js";
import { applySettings } from "./apply.js";
import * as ui from "./ui.js";
import { which } from "./deps.js";
import { unregisteredDirs } from "./status.js";
import { ago } from "./plan.js";
import { HOOK_EVENTS, hooksStatus } from "./hooks.js";
import { add, fixRemote } from "./projects.js";
import { findOldNames, migrate } from "./migrate.js";
import { orphans } from "./remove.js";

type R = ["ok" | "warn" | "fail", string];
const LINKS = ["CLAUDE.md", "rules", "agents", "themes", "keybindings.json", "plans"];

/** Registered projects (present here) and workspace directories that have no remote yet — the ensure-remote candidates. */
export function remoteless(man: Manifest, m: Machine): { projects: Project[]; dirs: { name: string; remote: string }[] } {
  const ws = workspace(man, m);
  const projects = selectedProjects(man, m).filter((p) => { const c = locate(p, ws); return present(c) ? !p.url : c.why !== "missing"; });
  return { projects, dirs: unregisteredDirs(ws, new Set(Object.values(man.projects).map((p) => p.path || p.name))) };
}
/** Returns the share's path: the old-name moves may have relocated it. */
export async function fix(repo: string, m: Machine, man: Manifest): Promise<string> {
  const mig = migrate(repo, m, man); for (const d of mig.done) ui.ok(d);
  if (mig.repo !== repo) { repo = mig.repo; man = loadManifest(repo); }
  const ws = workspace(man, m);
  const { projects, dirs } = remoteless(man, m);
  for (const p of projects) {
    if (!ui.canAsk()) { ui.warn(`${p.name}: no remote — run cs doctor --fix in a terminal to create one`); continue; }
    if (await ui.confirm(`${p.name} has no remote — create a private GitHub repo and push it?`, true)) { if (await fixRemote(repo, m, man, p)) man = loadManifest(repo); }
  }
  for (const d of dirs) {
    const path = join(ws, d.name);
    if (!ui.canAsk()) { ui.warn(`${d.name}: not registered — cs add ${contract(path)}`); continue; }
    if (await ui.confirm(`${d.name} is not registered — register it${d.remote ? "" : " (creating a private GitHub repo)"}?`, true)) { try { await add(repo, m, man, path, { profiles: [], description: "", noCommit: false }); man = loadManifest(repo); } catch (e: any) { ui.fail(e.message); } }
  }
  for (const p of selectedProjects(man, m)) {
    const c = locate(p, ws); if (!present(c) || !p.url) continue; const root = c.root;
    const url = git.remoteUrl(root); if (url === p.url) continue;
    const cur = git.canonicalGithub(url), want = git.canonicalGithub(p.url);
    let same = cur === want; const ident = p.identity ? man.identities[p.identity] : undefined;
    if (!same && ident && identityMatches(ident, cur) && cur.split("/").pop() === want.split("/").pop()) same = true;
    if (same) { git.git(["remote", "set-url", "origin", p.url], root); ui.ok(`${p.name}: remote url ${url} → ${p.url}`); }
    else ui.warn(`${p.name}: remote ${url} is a different repo than manifest ${p.url}; not changing it`);
  }
  return repo;
}
export async function runDoctor(repo: string, m: Machine, man: Manifest, doFix = false, compact = false): Promise<number> {
  if (doFix) { repo = await fix(repo, m, man); man = loadManifest(repo); }
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
  for (const p of selectedProjects(man, m)) { const c = locate(p, ws); if (!present(c) && c.why !== "no remote") continue; const root = c.root;   // a remote-less repo still has an identity to check
    const ident = p.identity ? man.identities[p.identity] : undefined; const email = git.configGet(root, "user.email"); const url = git.remoteUrl(root);
    if (p.url && git.canonicalGithub(url) !== git.canonicalGithub(p.url)) idr.push(["warn", `${p.name}: remote ${url} ≠ manifest ${p.url}  (cs doctor --fix)`]);
    else if (url && p.url && url !== p.url) idr.push(["warn", `${p.name}: remote uses alias/other form ${url}; manifest ${p.url}  (cs doctor --fix)`]);
    if (ident && email !== ident.email) idr.push(["fail", `${p.name}: user.email resolves to '${email || "UNSET"}', expected ${ident.email}`]); }
  res.push(...(idr.length ? idr : [["ok", "git identities resolve per manifest"] as R]));
  const hs = hooksStatus(repo);
  res.push(hs.complete ? ["ok", `hooks installed (${HOOK_EVENTS.join(", ")})`] : ["warn", `hooks ${hs.events.length ? "outdated" : "not installed"}  (cs sync re-installs them)`]);
  res.push(hs.timerActive ? ["ok", "timer active (share sync every 15 min)"] : hs.timerFiles ? ["warn", "timer installed but not active  (cs sync re-installs it)"] : ["warn", "timer not installed  (cs sync installs it)"]);
  res.push(hs.lastSync ? ["ok", `last share sync ${ago(hs.lastSync)}`] : ["warn", "the share has never synced here  (cs sync)"]);
  if (m.secretsBackend !== "none" && existsSync(join(repo, ".sops.yaml"))) {
    const machines = existsSync(join(repo, "machines")) ? readdirSync(join(repo, "machines")).filter((d) => existsSync(join(repo, "machines", d, "age.pub"))) : [];
    if (!machines.includes("recovery")) res.push(["warn", "secrets have no recovery key — cs secrets recovery (print it once, keep it in your password manager)"]);
    const others = machines.filter((d) => d !== m.name && d !== "recovery");
    if (others.length) res.push(["ok", `machines trusted with the secrets: ${others.join(", ")}  (cs untrust <machine> when one is retired)`]);
  }
  const old = findOldNames(repo, m, man);
  for (const o of old) res.push(["warn", `old name — ${o.what}: ${o.move}${o.then ? `; ${o.then}` : ""}  ${o.apply ? "(cs doctor --fix; docs/MIGRATION.md)" : "(by hand; docs/MIGRATION.md)"}`]);
  if (!old.length) res.push(["ok", "on-disk names current (share key, share, handoffs, state)"]);
  const rl = remoteless(man, m);
  for (const p of rl.projects) res.push(["fail", `${p.name}: no remote  (cs doctor --fix · or cs remove ${p.name})`]);
  for (const d of rl.dirs) res.push(["warn", `${contract(join(ws, d.name))}: not registered${d.remote ? "" : ", no remote"}  (cs add ${contract(join(ws, d.name))})`]);
  if (!rl.projects.length && !rl.dirs.length) res.push(["ok", "every project has a remote; nothing unregistered under the workspace"]);
  const left = orphans(repo, man);   // state or secrets for a name no longer in the manifest: never fixed by --fix, removal always asks (or takes --yes)
  for (const n of left) res.push(["warn", `${n}: state/secrets in the share but not registered  (cs remove ${n})`]);
  if (!left.length) res.push(["ok", "the share holds state and secrets for registered projects only"]);
  const sym = { ok: ui.green("✓"), warn: ui.yellow("!"), fail: ui.red("✗") };
  if (compact) { const bad = res.filter(([l]) => l !== "ok"); if (bad.length) ui.table(bad.map(([l, msg]) => [sym[l], msg])); ui.step(`${res.length - bad.length} of ${res.length} checks passed`); }
  else ui.table(res.map(([l, msg]) => [sym[l], msg]));
  return res.some(([l]) => l === "fail") ? 1 : 0;
}
