/** cs import memory|project|mcp <name>: pull existing local state into the share. */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { claudeDir, claudeJson, contract } from "./paths.js";
import type { Project } from "./manifest.js";
import { workspace, type Share } from "./share.js";
import { checkoutRoot, container, dirs } from "./checkout.js";
import { memoryDir, projectState, syncProject } from "./link.js";
import { dumps, loads } from "./jsonmerge.js";
import * as ui from "./ui.js";

export const claudeProjectKey = (p: string) => p.replace(/[^A-Za-z0-9]/g, "-");
export function candidatePaths(p: Project, ws: string): string[] {
  const c = [container(p, ws), checkoutRoot(p, ws), ...dirs(p, ws)]; return [...new Set(c)];
}
export const unionLines = (a: string, b: string) => { const lines = a.split("\n").filter((x, i, arr) => !(i === arr.length - 1 && x === "")); const seen = new Set(lines);
  for (const l of b.split("\n")) if (l && !seen.has(l)) { lines.push(l); seen.add(l); } return lines.join("\n") + "\n"; };

function walkFiles(dir: string): string[] { const out: string[] = []; const rec = (d: string) => { for (const e of readdirSync(d, { withFileTypes: true })) { const f = join(d, e.name); e.isDirectory() ? rec(f) : out.push(f); } }; if (existsSync(dir)) rec(dir); return out.sort(); }

export function importMemory(repo: string, p: Project, ws: string, machine: string, check = false): number {
  const dest = memoryDir(repo, p); let n = 0;
  for (const cand of candidatePaths(p, ws)) {
    const src = join(claudeDir(), "projects", claudeProjectKey(cand), "memory");
    if (!existsSync(src)) continue;
    ui.info(`${p.name}: importing memory from ${contract(src)}`);
    for (const f of walkFiles(src)) {
      const rel = relative(src, f); const target = join(dest, rel);
      if (!existsSync(target)) { ui.step(`+ ${rel}`); if (!check) { mkdirSync(dirname(target), { recursive: true }); copyFileSync(f, target); } n++; }
      else if (readFileSync(target).equals(readFileSync(f))) continue;
      else if (basename(rel) === "MEMORY.md") { ui.step(`~ ${rel} (union)`); if (!check) writeFileSync(target, unionLines(readFileSync(target, "utf8"), readFileSync(f, "utf8"))); n++; }
      else { const alt = join(dirname(target), `${basename(rel, extname(rel))}.from-${machine}-${new Date().toISOString().slice(0, 10)}${extname(rel)}`); ui.step(`? ${rel} differs → ${basename(alt)}`); if (!check) copyFileSync(f, alt); n++; }
    }
    if (!check) writeFileSync(join(dirname(src), "memory.imported-by-cs"), `imported into ${contract(dest)} on ${new Date().toISOString().slice(0, 10)}\n`);
  }
  if (!n) ui.ok(`${p.name}: no new memory to import`);
  return n;
}
export function importProjectFiles(repo: string, p: Project, ws: string, check = false) {
  const ch = syncProject(repo, p, ws, check); for (const c of ch) ui.step(`${p.name}: ${c}`); if (!ch.length) ui.ok(`${p.name}: nothing to import`); return ch.length;
}
export function envVarName(server: string, key: string) {
  const st = server.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean); let kt = key.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  if (st.length && kt.length && kt[0] === st[0]) kt = kt.slice(1); return [...st, ...kt].join("_");
}
function localScope(p: Project, ws: string): Record<string, any> {
  if (!existsSync(claudeJson())) return {};
  const data = JSON.parse(readFileSync(claudeJson(), "utf8")); const found: Record<string, any> = {};
  for (const cand of candidatePaths(p, ws)) for (const [n, cfg] of Object.entries<any>(data.projects?.[cand]?.mcpServers ?? {})) found[n] ??= cfg;
  return found;
}
export function importMcp(repo: string, p: Project, ws: string, check = false, show = false): number {
  const found = localScope(p, ws);
  if (show) { for (const [n, cfg] of Object.entries<any>(found)) { for (const [k, v] of Object.entries<any>(cfg.env ?? {})) console.log(`${envVarName(n, k)}=${v}`); for (const [k, v] of Object.entries<any>(cfg.headers ?? {})) console.log(`${envVarName(n, k)}=${v}`); } return Object.keys(found).length; }
  if (!Object.keys(found).length) { ui.ok(`${p.name}: no local-scope MCP servers in ~/.claude.json`); return 0; }
  const side = projectState(repo, p); const f = join(side, ".mcp.json");
  const existing: any = existsSync(f) ? loads(readFileSync(f, "utf8")) : { mcpServers: {} }; existing.mcpServers ??= {};
  const secrets: Record<string, string> = {};
  for (const [name, orig] of Object.entries<any>(found)) {
    const cfg = JSON.parse(JSON.stringify(orig));
    for (const k of Object.keys(cfg.env ?? {})) { secrets[envVarName(name, k)] = cfg.env[k]; cfg.env[k] = "${" + envVarName(name, k) + "}"; }
    for (const k of Object.keys(cfg.headers ?? {})) { secrets[envVarName(name, k)] = cfg.headers[k]; cfg.headers[k] = "${" + envVarName(name, k) + "}"; }
    delete cfg.oauth;
    if (JSON.stringify(existing.mcpServers[name]) === JSON.stringify(cfg)) continue;
    ui.step(`${p.name}: .mcp.json ← ${name} (${cfg.type ?? "stdio"})`); existing.mcpServers[name] = cfg;
  }
  if (!check) { mkdirSync(join(side, ".claude"), { recursive: true }); writeFileSync(f, dumps(existing));
    const sl = join(side, ".claude", "settings.local.json"); const sd: any = existsSync(sl) ? loads(readFileSync(sl, "utf8")) : {};
    sd.enabledMcpjsonServers = [...new Set([...(sd.enabledMcpjsonServers ?? []), ...Object.keys(existing.mcpServers)])].sort(); writeFileSync(sl, dumps(sd)); }
  if (Object.keys(secrets).length) { ui.warn(`${p.name}: values replaced by \${VAR} placeholders — store them: cs secrets set global ${Object.keys(secrets).map((k) => `${k}=…`).join(" ")}  (full values: cs import mcp ${p.name} --show)`); }
  return Object.keys(found).length;
}
export function runImport(share: Share, what: string, names: string[], check: boolean, show: boolean) {
  const repo = share.path, m = share.machine, man = share.manifest; const ws = workspace(share);
  if (!names.length) throw new Error("cs: import needs a project name (or --all)");
  for (const n of names) { const p = man.projects[n]; if (!p) throw new Error(`cs: unknown project '${n}'`);
    if (what === "memory") importMemory(repo, p, ws, m.name, check); else if (what === "project") importProjectFiles(repo, p, ws, check); else if (what === "mcp") importMcp(repo, p, ws, check, show); else throw new Error(`cs: unknown import target '${what}'`); }
}
