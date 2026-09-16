/** The gather step shared by cs sync and bare cs: locate every selected project's checkout, fetch its handoff refs
 *  (per-project time cap, offline tolerated) and observe its .env files against the share. Decides nothing and prints
 *  nothing but spinner labels — src/plan.ts turns the facts into actions or a status line. */
import { readdirSync } from "node:fs";
import * as git from "./git.js";
import { selectedProjects, workspace, type Share } from "./share.js";
import { enabled, fetchWaiting, locate, present } from "./checkout.js";
import { getBackend } from "./secrets/index.js";
import { observeEnv } from "./envfiles.js";
import { isEnvName } from "./env.js";
import type { Facts } from "./plan.js";
import * as ui from "./ui.js";

export interface Gathered { facts: Facts[]; envSkipped: string[] }

/** `fetch: false` (bare cs --no-fetch) reads the handoff refs fetched last time. Absent projects (missing, not a repo,
 *  without a remote) are not facts: cs sync's clone step and cs doctor report those. .env files are observed only when
 *  this machine can read the secrets; otherwise `envSkipped` says why (once, and only when a project has such a file). */
export async function gather(share: Share, o: { timeout: number; fetch?: boolean }): Promise<Gathered> {
  const ws = workspace(share); const m = share.machine; const facts: Facts[] = [];
  const backend = await getBackend(m); const canRead = backend.name !== "none" && backend.ready(share.path); const envSkipped: string[] = [];
  const names = new Set(Object.keys(share.manifest.projects));
  for (const p of selectedProjects(share)) {
    const c = locate(p, ws); if (!present(c)) continue;
    const f: Facts = { checkout: c, waiting: [] };
    facts.push(f);
    if (p.env !== false) {
      if (canRead) { try { f.env = await observeEnv(share, backend, p, c.root, names); }
        catch (e: any) { envSkipped.push(`${p.name}: .env files not carried — ${String(e?.message ?? e).replace(/^cs: /, "").split("\n")[0]}`); } }
      else if (!envSkipped.length && hasIgnoredEnv(c.root)) envSkipped.push(backend.name === "none" ? ".env files not carried — secrets backend is 'none' (machine.toml [secrets].backend)" : `.env files not carried — this machine cannot read the secrets yet: cs secrets init here, or cs trust ${m.name} on a machine that can`);
    }
    if (!enabled(p)) continue;
    const r = await ui.spin(`${p.name}: fetching…`, () => fetchWaiting(c, { timeout: o.timeout, fetch: o.fetch }));
    if (!r.ok) { f.offline = true; continue; }
    f.waiting = r.list;
  }
  return { facts, envSkipped };
}
/** A gitignored .env* file is here — one that would travel if this machine could read the secrets (a tracked .env.example is not). */
const hasIgnoredEnv = (root: string) => { try { return readdirSync(root).some((n) => isEnvName(n) && git.git(["check-ignore", "-q", "--", n], root, { check: false }).code === 0); } catch { return false; } };
