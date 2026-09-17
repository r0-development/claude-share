/** cs handoff / cs resume / cs handoffs / cs note — the manual halves of what cs sync does: thin loops over the Checkout
 *  module's verbs (src/checkout.ts), deciding with the same plan (src/plan.ts). --overwrite / --replace answer the
 *  dirty-vs-waiting question the way the plan screen would; without them the question is a refusal. */
import { existsSync, readFileSync, rmSync } from "node:fs";
import * as git from "./git.js";
import { contract } from "./paths.js";
import type { Project } from "./manifest.js";
import { projectForPath, selectedProjects, workspace, type Share } from "./share.js";
import { apply, enabled, fetchWaiting, handoffRef, loadState, locate, noteFile, present, send, userSlug, type Checkout, type Handoff } from "./checkout.js";
import { placeAll } from "./projectstate.js";
import { plan, type HandoffQuestion } from "./plan.js";
import * as ui from "./ui.js";

/** The project's checkout and what waits on its remote, or undefined (with the reason printed) when there is nothing to work on. */
async function observe(p: Project, ws: string, o: { allow?: string[]; label: string }): Promise<{ checkout: Checkout; waiting: Handoff[]; offline: boolean } | undefined> {
  if (!enabled(p)) { ui.skip(`${p.name}: handoff disabled`); return undefined; }
  const c = locate(p, ws, { allow: o.allow }); if (!present(c)) { if (c.why !== "missing") ui.skip(`${p.name}: ${c.why}`); return undefined; }
  const r = await ui.spin(`${p.name}: ${o.label}…`, () => fetchWaiting(c));
  return { checkout: c, waiting: r.list, offline: !r.ok };
}
const questions = (pl: ReturnType<typeof plan>) => pl.questions.filter((q): q is HandoffQuestion => q.kind === "dirty-vs-waiting");

/** Send every dirty or unpushed unit of `projects` as the plan would; `overwrite` sends over another machine's waiting handoff (backed up first). */
export async function handoff(share: Share, projects: Project[], o: { note?: string; dryRun?: boolean; allow?: string[]; overwrite?: boolean }): Promise<number> {
  const ws = workspace(share); const m = share.machine; let rc = 0;
  for (const p of projects) {
    const f = await observe(p, ws, { allow: o.allow, label: "fetching handoffs" }); if (!f) continue;
    const pl = plan([f], m.name);
    // what cs sync merely skips is a refusal here: the user asked for this work to leave the machine and it will not
    const secret = f.checkout.units.filter((u) => u.secrets?.length);
    for (const u of secret) { ui.fail(`${p.name}${u.rel === "." ? "" : "/" + u.rel}: refusing to hand off files that look secret: ${u.secrets!.join(", ")}  (--allow <glob> to override)`); rc = 1; }
    for (const s of pl.skipped) if (!secret.some((u) => s.startsWith(`${p.name} · ${u.branch}: not sent`))) ui.skip(s);
    for (const a of pl.actions) if (a.kind === "send" && !(await send(a.checkout, a.unit, m, { note: o.note, allow: o.allow, dryRun: o.dryRun })).ok && !o.dryRun) rc = 1;
    for (const q of questions(pl)) {   // my dirty unit is on the branch another machine's handoff waits for: only --overwrite sends over it
      if (!q.sameBranch) continue;
      if (o.overwrite) { if (!(await send(q.checkout, q.unit, m, { note: o.note, allow: o.allow, dryRun: o.dryRun, over: q.handoff })).ok && !o.dryRun) rc = 1; }
      else { ui.fail(`${p.name} · ${q.handoff.branch}: a handoff from ${q.handoff.machine} is waiting on ${q.handoff.ref} — run cs resume there first, or --overwrite`); rc = 1; }
    }
  }
  return rc;
}

/** Apply every waiting handoff of `projects` as the plan would; `replace` applies over a dirty unit (its changes backed up first). */
export async function resume(share: Share, projects: Project[], o: { replace?: boolean; keepRemote?: boolean; dryRun?: boolean }): Promise<number> {
  const ws = workspace(share); const m = share.machine; let rc = 0;
  const one = async (c: Checkout, h: Handoff, replace: boolean) => {
    const r = await apply(c, h, m, { replace, keepRemote: o.keepRemote, dryRun: o.dryRun }); if (!r.ok) { if (!o.dryRun) rc = 1; return; }
    placeAll(share, { names: [c.project.name] });   // project state into the unit (a new worktree has none yet); only if the project is selected here
    if (r.note) ui.note(r.note.trim().split("\n"), `note from ${h.machine}`);
  };
  for (const p of projects) {
    const f = await observe(p, ws, { label: "looking for handoffs" }); if (!f) continue;
    if (!f.waiting.length) { ui.skip(`${p.name}: nothing to resume`); continue; }
    const pl = plan([f], m.name);
    for (const a of pl.actions) if (a.kind === "apply") await one(a.checkout, a.handoff, false);
    for (const q of questions(pl)) {
      if (o.replace) await one(q.checkout, q.handoff, true);
      else { ui.fail(`${p.name} · ${q.handoff.branch}: ${contract(q.unit.path)} has uncommitted changes — commit them, or --replace (keeps a backup ref)`); rc = 1; }
    }
  }
  return rc;
}

export async function waitingList(share: Share, projects: Project[]): Promise<(Handoff & { project: string })[]> {
  const ws = workspace(share); const all: (Handoff & { project: string })[] = [];
  for (const p of projects) { const f = await observe(p, ws, { label: "fetching handoffs" }); if (!f) continue; for (const h of f.waiting) all.push({ ...h, project: p.name }); }
  return all;
}
export async function handoffGc(share: Share, projects: Project[], olderThanDays: number): Promise<number> {
  const ws = workspace(share); let n = 0;
  for (const p of projects) { const c = locate(p, ws); if (!present(c)) continue;
    for (const h of (await fetchWaiting(c)).list) { const age = (Date.now() - Date.parse(h.when)) / 86400000; if (age < olderThanDays) continue;
      await git.gitA(["push", "-q", "origin", "--delete", h.ref], c.root, { check: false }); ui.step(`${p.name}: dropped ${h.ref} (${Math.floor(age)} days old)`); n++; } }
  return n;
}
export async function handoffDrop(share: Share, p: Project, ref: string): Promise<void> {
  const c = locate(p, workspace(share)); if (!present(c)) throw new Error(`cs: ${p.name}: ${c.why}`);
  const full = ref.startsWith("handoff/") ? ref : handoffRef(userSlug(c.root), ref);
  await ui.spin(`removing ${full}…`, () => git.gitA(["push", "-q", "origin", "--delete", full], c.root, { timeout: 60 })); ui.ok(`dropped ${full}`);
}

/** Print (and forget) the note left by the last resume for the cwd's project. */
export function printNote(share: Share, cwd = process.cwd()): boolean {
  const p = projectForPath(share, cwd); if (!p) return false;
  const f = noteFile(p); if (!existsSync(f)) return false;
  const note = readFileSync(f, "utf8"); rmSync(f, { force: true });
  const st = loadState(p);
  process.stdout.write(`Handoff note for ${p.name}${st?.resumed?.from ? ` (from ${st.resumed.from}, resumed ${st.resumed.at?.slice(0, 16)})` : ""}:\n${note.trimEnd()}\n`);
  return true;
}
export const projectsFor = (share: Share, names: string[], all: boolean): Project[] => {
  if (names.length) return names.map((n) => { const p = share.manifest.projects[n]; if (!p) throw new Error(`cs: unknown project '${n}'`); return p; });
  if (all) return selectedProjects(share);
  const p = projectForPath(share, process.cwd()); if (!p) throw new Error("cs: not inside a registered project (pass a name or --all)"); return [p];
};
