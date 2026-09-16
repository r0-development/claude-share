/** The gather step shared by cs sync and bare cs: fetch every project's handoff refs (per-project time cap, offline
 *  tolerated), observe each checkout and its .env files against the share. Decides nothing and prints nothing but spinner
 *  labels — src/plan.ts turns the facts into actions or a status line. */
import { existsSync, readdirSync } from "node:fs";
import * as git from "./git.js";
import type { Machine } from "./machine.js";
import { checkoutRoot, selectedProjects, workspace, type Manifest } from "./manifest.js";
import { denyHits, enabled, fetchHandoffs, REF_NS, units, userSlug, type Handoff } from "./handoff.js";
import { getBackend } from "./secrets/index.js";
import { observeEnv, type EnvState } from "./envfiles.js";
import { isEnvName } from "./env.js";
import type { Facts } from "./plan.js";
import * as ui from "./ui.js";

/** `env` holds the full observation behind each project's `Facts.env` (values, times, snapshot) for cs sync's env step. */
export interface Gathered { facts: Facts[]; handoffs: Record<string, Handoff[]>; env: Record<string, EnvState[]>; envSkipped: string[] }

/** `fetch: false` (bare cs --no-fetch) reads the handoff refs fetched last time. Projects that are missing, not a repo or
 *  without a remote are not facts: cs sync's clone step and cs doctor report those. .env files are observed only when
 *  this machine can read the secrets; otherwise `envSkipped` says why (once, and only when a project has such a file). */
export async function gather(repo: string, m: Machine, man: Manifest, o: { timeout: number; fetch?: boolean }): Promise<Gathered> {
  const ws = workspace(man, m); const facts: Facts[] = []; const handoffs: Record<string, Handoff[]> = {}; const env: Record<string, EnvState[]> = {};
  const backend = await getBackend(m); const canRead = backend.name !== "none" && backend.ready(repo); const envSkipped: string[] = [];
  const names = new Set(Object.keys(man.projects));
  for (const p of selectedProjects(man, m)) {
    const root = checkoutRoot(p, ws);
    if (!existsSync(root) || !git.isRepo(root) || !git.remoteUrl(root)) continue;
    const f: Facts = { project: p.name, layout: p.layout, units: [], waiting: [] };
    facts.push(f);
    if (p.env !== false) {
      if (canRead) { try { env[p.name] = await observeEnv(repo, backend, p, root, names); f.env = env[p.name].filter((s) => s.kind === "values" || s.kind === "unignored").map((s) => ({ file: s.file, kind: s.kind as "values" | "unignored", merge: s.merge, from: s.storedFrom })); }
        catch (e: any) { envSkipped.push(`${p.name}: .env files not carried — ${String(e?.message ?? e).replace(/^cs: /, "").split("\n")[0]}`); } }
      else if (!envSkipped.length && hasIgnoredEnv(root)) envSkipped.push(backend.name === "none" ? ".env files not carried — secrets backend is 'none' (machine.toml [secrets].backend)" : `.env files not carried — this machine cannot read the secrets yet: cs secrets init here, or cs trust ${m.name} on a machine that can`);
    }
    for (const u of units(p, ws)) {
      const dirty = git.dirtyCount(u.path); const unpushed = git.aheadBehind(u.path)?.[0] ?? 0;
      const skip = !u.branch ? "detached HEAD" : u.branch.startsWith(`${REF_NS}/`) ? "on a handoff ref" : undefined;
      f.units.push({ rel: u.rel, branch: u.branch, dirty, unpushed, skip, secrets: dirty && !skip ? denyHits(u.path, p, []) : undefined });
    }
    if (!enabled(p)) { f.disabled = true; continue; }
    const r = await ui.spin(`${p.name}: fetching…`, () => fetchHandoffs(root, userSlug(root), o.timeout, o.fetch !== false));
    if (!r.ok) { f.offline = true; continue; }
    handoffs[p.name] = r.list;
    f.waiting = r.list.map((h) => ({ branch: h.branch, machine: h.machine, when: h.when, note: h.note, ref: h.ref }));
  }
  return { facts, handoffs, env, envSkipped };
}
/** A gitignored .env* file is here — one that would travel if this machine could read the secrets (a tracked .env.example is not). */
const hasIgnoredEnv = (root: string) => { try { return readdirSync(root).some((n) => isEnvName(n) && git.git(["check-ignore", "-q", "--", n], root, { check: false }).code === 0); } catch { return false; } };
