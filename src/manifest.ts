/** projects.toml — identities and projects. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, isAbsolute, resolve } from "node:path";
import { parse, stringify } from "smol-toml";
import { expand } from "./paths.js";
import type { Machine } from "./config.js";

export const SUPPORTED_SCHEMA = 1;
export const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
export const KINDS = ["git", "synced", "local"] as const;
export type Kind = (typeof KINDS)[number];

export interface Identity { id: string; name: string; email: string; owner: string; sshKey?: string; urlGlobs?: string[] }
export interface Project {
  name: string; kind: Kind; path?: string; url?: string; identity?: string; profiles: string[]; machines: string[];
  branch?: string; layout: "plain" | "worktrees"; postClone?: string; description?: string; handoff: Record<string, unknown>; sync: Record<string, unknown>;
}
export interface Manifest { workspaceRoot: string; defaultBranch: string; identities: Record<string, Identity>; projects: Record<string, Project>; schemaVersion: number; path?: string }

export const keyPath = (i: Identity) => i.sshKey || `~/.ssh/cs/${i.id}`;
export const globs = (i: Identity) => (i.urlGlobs?.length ? i.urlGlobs : i.owner ? [`git@github.com:${i.owner}/**`] : []);
export function globMatch(pattern: string, s: string): boolean {
  let re = "^";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*" && pattern[i + 1] === "*") { if (pattern[i + 2] === "/") { re += "(?:.*/)?"; i += 2; } else { re += ".*"; i++; } }
    else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(re + "$").test(s);
}
export const identityMatches = (i: Identity, url: string) => globs(i).some((g) => globMatch(g, url));
export function identityForUrl(m: Manifest, url: string) { return Object.values(m.identities).find((i) => identityMatches(i, url)); }
export function identityByFlag(m: Manifest, flag: string) {
  const f = flag.toLowerCase();
  return Object.values(m.identities).find((i) => i.id.toLowerCase() === f || i.owner?.toLowerCase() === f);
}

export function selected(p: Project, m: Machine): boolean {
  if (p.machines.length && !p.machines.includes(m.name)) return false;
  if (m.exclude.includes(p.name)) return false;
  return p.profiles.includes("all") || p.profiles.some((x) => m.profiles.includes(x));
}
export const workspace = (man: Manifest, m?: Machine) => expand(m?.workspace || man.workspaceRoot);
export const container = (p: Project, ws: string) => join(ws, p.path || p.name);
export const checkoutRoot = (p: Project, ws: string) => (p.layout === "worktrees" ? join(container(p, ws), "repo") : container(p, ws));
export const selectedProjects = (man: Manifest, m: Machine) => Object.values(man.projects).filter((p) => selected(p, m));
export function projectForPath(man: Manifest, m: Machine, path: string): Project | undefined {
  const ws = resolve(workspace(man, m)); const r = resolve(path);
  if (!(r === ws || r.startsWith(ws + "/"))) return undefined;
  const first = r.slice(ws.length + 1).split("/")[0];
  return first ? Object.values(man.projects).find((p) => (p.path || p.name) === first) : undefined;
}

export function parseManifest(text: string, path?: string): Manifest {
  const d = parse(text) as any;
  const identities: Record<string, Identity> = {};
  for (const [id, v] of Object.entries<any>(d.identities ?? {}))
    identities[id] = { id, name: v.name ?? "", email: v.email ?? "", owner: v.owner ?? v.github_owner ?? "", sshKey: v.ssh_key, urlGlobs: v.url_globs };
  const projects: Record<string, Project> = {};
  for (const [name, v] of Object.entries<any>(d.projects ?? {}))
    projects[name] = { name, kind: v.kind ?? "git", path: v.path, url: v.url, identity: v.identity, profiles: v.profiles ?? ["all"], machines: v.machines ?? [],
      branch: v.branch, layout: v.layout ?? "plain", postClone: v.post_clone, description: v.description, handoff: v.handoff ?? {}, sync: v.sync ?? {} };
  return { workspaceRoot: d.workspace?.root ?? "~/dev", defaultBranch: d.workspace?.default_branch ?? "master", identities, projects, schemaVersion: d.schema_version ?? 1, path };
}
export function validate(m: Manifest): string[] {
  const errs: string[] = [];
  if (m.schemaVersion > SUPPORTED_SCHEMA) errs.push(`projects.toml schema_version ${m.schemaVersion} > supported ${SUPPORTED_SCHEMA}; run cs self-update`);
  for (const i of Object.values(m.identities)) if (!i.owner && !i.urlGlobs?.length) errs.push(`identity ${i.id}: needs owner (GitHub user/org)`);
  for (const p of Object.values(m.projects)) {
    if (!NAME_RE.test(p.name)) errs.push(`${p.name}: invalid project name`);
    if (!KINDS.includes(p.kind)) errs.push(`${p.name}: kind must be one of ${KINDS.join("|")}`);
    if (p.kind === "git") {
      if (!p.url) errs.push(`${p.name}: kind=git requires url`);
      if (!p.identity) errs.push(`${p.name}: kind=git requires identity`);
      else if (!m.identities[p.identity]) errs.push(`${p.name}: unknown identity '${p.identity}'`);
      else if (p.url && !identityMatches(m.identities[p.identity], p.url)) errs.push(`${p.name}: url ${p.url} does not match identity '${p.identity}'`);
    }
    if (p.path && (isAbsolute(p.path) || p.path.split("/").includes(".."))) errs.push(`${p.name}: path must be relative and inside the workspace`);
  }
  return errs;
}
export function loadManifest(repo: string): Manifest {
  const f = join(repo, "projects.toml");
  if (!existsSync(f)) throw new Error(`cs: no projects.toml in ${repo}`);
  const m = parseManifest(readFileSync(f, "utf8"), f);
  const errs = validate(m);
  if (errs.length) throw new Error("cs: projects.toml invalid:\n  " + errs.join("\n  "));
  return m;
}

function block(header: string, values: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) if (v !== undefined && v !== "" && !(Array.isArray(v) && !v.length)) clean[k] = v;
  return `[${header}]\n` + stringify(clean).trimEnd() + "\n";
}
export function projectBlock(p: Project) {
  return block(`projects.${p.name}`, { kind: p.kind, path: p.path && p.path !== p.name ? p.path : undefined, url: p.kind === "git" ? p.url : undefined,
    identity: p.kind === "git" ? p.identity : undefined, branch: p.kind === "git" ? p.branch : undefined, profiles: p.profiles,
    machines: p.machines, layout: p.layout !== "plain" ? p.layout : undefined, post_clone: p.postClone, description: p.description });
}
export function identityBlock(i: Identity) {
  return block(`identities.${i.id}`, { owner: i.owner, name: i.name, email: i.email, ssh_key: i.sshKey && i.sshKey !== `~/.ssh/cs/${i.id}` ? i.sshKey : undefined,
    url_globs: i.urlGlobs && JSON.stringify(i.urlGlobs) !== JSON.stringify([`git@github.com:${i.owner}/**`]) ? i.urlGlobs : undefined });
}
export function appendProject(repo: string, p: Project) {
  const f = join(repo, "projects.toml"); let t = readFileSync(f, "utf8");
  if (new RegExp(`^\\[projects\\.${p.name.replace(/[.]/g, "\\.")}\\]\\s*$`, "m").test(t)) throw new Error(`cs: project '${p.name}' already registered (edit projects.toml to change it)`);
  writeFileSync(f, t.replace(/\n*$/, "\n\n") + projectBlock(p));
}
export function appendIdentity(repo: string, i: Identity) {
  const f = join(repo, "projects.toml"); let t = readFileSync(f, "utf8");
  if (new RegExp(`^\\[identities\\.${i.id.replace(/[.]/g, "\\.")}\\]\\s*$`, "m").test(t)) throw new Error(`cs: identity '${i.id}' already exists`);
  const marker = "# ---- Projects";
  const b = identityBlock(i);
  t = t.includes(marker) ? t.slice(0, t.indexOf(marker)).replace(/\n*$/, "\n\n") + b + "\n" + t.slice(t.indexOf(marker)) : t.replace(/\n*$/, "\n\n") + b;
  writeFileSync(f, t);
}
