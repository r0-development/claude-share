/** The gather step shared by cs sync and bare cs: fetch every project's handoff refs (per-project time cap, offline
 *  tolerated) and observe each checkout. Decides nothing and prints nothing but spinner labels — src/plan.ts turns the facts
 *  into actions or a status line. */
import { existsSync } from "node:fs";
import * as git from "./git.js";
import type { Machine } from "./machine.js";
import { checkoutRoot, selectedProjects, workspace, type Manifest } from "./manifest.js";
import { denyHits, enabled, fetchHandoffs, REF_NS, units, userSlug, type Handoff } from "./handoff.js";
import type { Facts } from "./plan.js";
import * as ui from "./ui.js";

export interface Gathered { facts: Facts[]; handoffs: Record<string, Handoff[]> }

/** `fetch: false` (bare cs --no-fetch) reads the handoff refs fetched last time. Projects that are missing, not a repo or
 *  without a remote are not facts: cs sync's clone step and cs doctor report those. */
export async function gather(m: Machine, man: Manifest, o: { timeout: number; fetch?: boolean }): Promise<Gathered> {
  const ws = workspace(man, m); const facts: Facts[] = []; const handoffs: Record<string, Handoff[]> = {};
  for (const p of selectedProjects(man, m)) {
    const root = checkoutRoot(p, ws);
    if (!existsSync(root) || !git.isRepo(root) || !git.remoteUrl(root)) continue;
    const f: Facts = { project: p.name, layout: p.layout, units: [], waiting: [] };
    facts.push(f);
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
  return { facts, handoffs };
}
