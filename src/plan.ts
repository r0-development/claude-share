/** cs sync, the pure middle: facts gathered per project → the actions to take (with their defaults) and the
 *  questions only a human can answer. No I/O here, so the table in tests/unit.test.ts covers every rule. */

/** One checkout of a project (the root, or one worktree). `branch` is "" when detached. */
export interface Unit { rel: string; branch: string; dirty: number; unpushed: number; skip?: string; secrets?: string[] }
/** A handoff waiting on the project's remote. */
export interface Waiting { branch: string; machine: string; when: string; note: string; ref: string }
export interface Facts { project: string; layout: "plain" | "worktrees"; units: Unit[]; waiting: Waiting[]; offline?: boolean; disabled?: boolean }

/** `push` is a real branch's local-only commits going to its upstream — offered, never checked by default (the handoff carries them anyway). */
export interface Action { id: string; kind: "send" | "apply" | "push"; project: string; branch: string; label: string; hint: string; checked: boolean }
/** A situation cs sync must not decide alone: it is asked after the plan screen (src/sync.ts). `unit` is the dirty checkout;
 *  `sameBranch` — the dirty unit is on the waiting branch, so "send mine over it" is a possible answer. */
export interface Question { kind: "dirty-vs-waiting"; project: string; branch: string; machine: string; when: string; unit: string; sameBranch: boolean; why: string }
/** Answers to a dirty-vs-waiting question: apply the handoff (local → backup ref), keep local and leave it waiting, send local over it (handoff → backup ref). */
export type Answer = "apply" | "keep" | "send";
export interface Plan { actions: Action[]; questions: Question[]; skipped: string[] }

/** "1 change" / "3 changes" — shared with the gather lines in src/sync.ts so both read the same. */
export const count = (c: number, one: string, many = one + "s") => `${c} ${c === 1 ? one : many}`;
/** "2026-09-16 08:00" from an ISO timestamp. */
export const when = (iso: string) => iso.slice(0, 16).replace("T", " ");
/** "3 min ago" / "2 h ago" / "5 d ago" (or the raw text when it is not a time, e.g. "offline"). */
export function ago(iso: string, now = Date.now()): string {
  const t = Date.parse(iso); if (isNaN(t)) return iso; const s = Math.max(0, (now - t) / 1000);
  return s < 90 ? "just now" : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago`;
}

export function plan(facts: Facts[], machine: string): Plan {
  const actions: Action[] = [], questions: Question[] = [], skipped: string[] = [];
  for (const f of facts) {
    if (f.disabled) { skipped.push(`${f.project}: handoff disabled`); continue; }
    if (f.offline) { skipped.push(`${f.project}: remote unreachable — nothing sent or applied`); continue; }
    const handled = new Set<string>();   // branches with an apply or a question: never also sent in the same run
    for (const w of f.waiting) {
      // plain layout: the root is the only unit and must be clean to check the branch out; worktrees: the branch's own worktree, if any
      const target = f.layout === "plain" ? f.units[0] : f.units.find((u) => u.branch === w.branch);
      if (f.layout === "plain" && !target) continue;
      if (target && target.dirty) {
        if (w.machine === machine && target.branch === w.branch) continue;   // my own earlier handoff; the dirty tree here is the newer copy and gets sent again
        handled.add(w.branch);
        questions.push({ kind: "dirty-vs-waiting", project: f.project, branch: w.branch, machine: w.machine, when: w.when, unit: target.rel, sameBranch: target.branch === w.branch,
          why: `${f.project}: a handoff from ${w.machine} (${when(w.when)}) is waiting for ${w.branch}, but ${target.rel === "." ? "the checkout" : target.rel}${target.branch === w.branch ? "" : ` (on ${target.branch})`} has ${count(target.dirty, "uncommitted change")}` });
        continue;
      }
      handled.add(w.branch);
      actions.push({ id: `apply:${f.project}:${w.branch}`, kind: "apply", project: f.project, branch: w.branch, label: `${f.project} · ${w.branch}`,
        hint: `from ${w.machine}, ${when(w.when)}${w.note ? " — " + w.note : ""}`, checked: true });
    }
    for (const u of f.units) {
      if (u.skip) { skipped.push(`${f.project}${u.rel === "." ? "" : "/" + u.rel}: ${u.skip}`); continue; }
      if (!u.dirty && !u.unpushed) continue;
      const label = `${f.project} · ${u.branch}`;
      // the real branch: its own row, unchecked, independent of what happens to the handoff (ADR-0002: only this screen pushes it)
      const push = u.unpushed ? { id: `push:${f.project}:${u.branch}`, kind: "push" as const, project: f.project, branch: u.branch, label, hint: `${count(u.unpushed, "unpushed commit")} → upstream`, checked: false } : undefined;
      if (handled.has(u.branch) || u.secrets?.length) {
        if (u.secrets?.length) skipped.push(`${label}: not sent — files that look secret: ${u.secrets.join(", ")}  (cs handoff --allow <glob>)`);
        if (push) actions.push(push);
        continue;
      }
      const own = f.waiting.some((w) => w.branch === u.branch && w.machine === machine);
      const bits = [u.dirty ? count(u.dirty, "change") : "", u.unpushed ? count(u.unpushed, "unpushed commit") : "", own ? "replaces the handoff sent from here earlier" : ""].filter(Boolean);
      actions.push({ id: `send:${f.project}:${u.branch}`, kind: "send", project: f.project, branch: u.branch, label, hint: bits.join(", "), checked: true });
      if (push) actions.push(push);
    }
  }
  return { actions, questions, skipped };
}

/** Bare cs: one project's facts as the bits of its status line. `pending` — cs sync would do or ask something here;
 *  `stuck` — dirty or unpushed work cs sync cannot carry (detached, on a handoff ref, files that look secret): the bit says what to do. */
export interface StatusBit { kind: "dirty" | "unpushed" | "waiting" | "offline" | "disabled" | "skip"; text: string }
export function status(f: Facts, machine: string): { bits: StatusBit[]; pending: boolean; stuck: boolean } {
  const bits: StatusBit[] = []; let stuck = false;
  for (const u of f.units) {
    const at = u.rel === "." ? "" : `${u.rel}: `;   // worktrees: the root is the row's branch, the others say where
    const work = u.dirty > 0 || u.unpushed > 0;
    if (u.dirty) bits.push({ kind: "dirty", text: `${at}${u.dirty} dirty` });
    if (u.unpushed) bits.push({ kind: "unpushed", text: `${at}↑${u.unpushed} unpushed` });
    if (u.skip) { bits.push({ kind: "skip", text: `${at}${u.skip}${work ? " — not carried by cs sync: check a branch out" : ""}` }); if (work) stuck = true; }
    if (u.secrets?.length) { bits.push({ kind: "skip", text: `${at}not sent — files that look secret: ${u.secrets.join(", ")} (cs handoff --allow <glob>)` }); stuck = true; }
  }
  const here = f.units[0]?.branch;
  for (const w of f.waiting) bits.push({ kind: "waiting", text: `handoff waiting from ${w.machine}${w.branch === here ? "" : ` for ${w.branch}`} (${when(w.when)})` });
  if (f.offline) bits.push({ kind: "offline", text: "offline" });
  if (f.disabled) bits.push({ kind: "disabled", text: "handoff disabled" });
  const pl = plan([{ ...f, offline: false }], machine);   // offline: what cs sync would do once the remote is reachable again
  return { bits, pending: pl.actions.length > 0 || pl.questions.length > 0, stuck };
}
