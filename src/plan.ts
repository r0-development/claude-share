/** cs sync, the pure middle: facts gathered per project → the actions to take (with their defaults) and the
 *  questions only a human can answer. No I/O here, so the table in tests/unit.test.ts covers every rule. */

/** One checkout of a project (the root, or one worktree). `branch` is "" when detached. */
export interface Unit { rel: string; branch: string; dirty: number; unpushed: number; skip?: string; secrets?: string[] }
/** A handoff waiting on the project's remote. */
export interface Waiting { branch: string; machine: string; when: string; note: string; ref: string }
export interface Facts { project: string; layout: "plain" | "worktrees"; units: Unit[]; waiting: Waiting[]; offline?: boolean; disabled?: boolean }

export interface Action { id: string; kind: "send" | "apply"; project: string; branch: string; label: string; hint: string; checked: boolean }
/** A situation cs sync must not decide alone (ticket #6 turns these into prompts; until then they are reported). */
export interface Question { kind: "dirty-vs-waiting"; project: string; branch: string; machine: string; why: string }
export interface Plan { actions: Action[]; questions: Question[]; skipped: string[] }

/** "1 change" / "3 changes" — shared with the gather lines in src/sync.ts so both read the same. */
export const count = (c: number, one: string, many = one + "s") => `${c} ${c === 1 ? one : many}`;
/** "2026-09-16 08:00" from an ISO timestamp. */
export const when = (iso: string) => iso.slice(0, 16).replace("T", " ");

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
        questions.push({ kind: "dirty-vs-waiting", project: f.project, branch: w.branch, machine: w.machine, why: `${f.project}: a handoff from ${w.machine} is waiting for ${w.branch}, but ${target.rel === "." ? "the checkout" : target.rel} has uncommitted changes` });
        continue;
      }
      handled.add(w.branch);
      actions.push({ id: `apply:${f.project}:${w.branch}`, kind: "apply", project: f.project, branch: w.branch, label: `${f.project} · ${w.branch}`,
        hint: `from ${w.machine}, ${when(w.when)}${w.note ? " — " + w.note : ""}`, checked: true });
    }
    for (const u of f.units) {
      if (u.skip) { skipped.push(`${f.project}${u.rel === "." ? "" : "/" + u.rel}: ${u.skip}`); continue; }
      if (!u.dirty && !u.unpushed) continue;
      if (handled.has(u.branch)) continue;
      if (u.secrets?.length) { skipped.push(`${f.project} · ${u.branch}: not sent — files that look secret: ${u.secrets.join(", ")}  (cs handoff --allow <glob>)`); continue; }
      const own = f.waiting.some((w) => w.branch === u.branch && w.machine === machine);
      const bits = [u.dirty ? count(u.dirty, "change") : "", u.unpushed ? count(u.unpushed, "unpushed commit") : "", own ? "replaces the handoff sent from here earlier" : ""].filter(Boolean);
      actions.push({ id: `send:${f.project}:${u.branch}`, kind: "send", project: f.project, branch: u.branch, label: `${f.project} · ${u.branch}`, hint: bits.join(", "), checked: true });
    }
  }
  return { actions, questions, skipped };
}
