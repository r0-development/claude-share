/** cs sync, the pure middle: facts gathered per project → the actions to take (with their defaults) and the
 *  questions only a human can answer. No I/O here, so the table in tests/unit.test.ts covers every rule. Every action and
 *  question carries the checkout, unit, handoff or .env state it was decided on, so execution never re-finds them (ADR-0004). */
import { enabled, type Checkout, type Handoff, type Unit } from "./checkout.js";
import { describeKeys, describeMerge } from "./env.js";
import type { EnvState } from "./envfiles.js";

/** One project as gathered: its checkout here, the handoffs waiting on its remote, its `.env*` files as src/envfiles.ts
 *  saw them (ADR-0003; a `tracked` file is git's business and gets no row). `offline` — the remote could not be fetched. */
export interface Facts { checkout: Checkout; waiting: Handoff[]; env?: EnvState[]; offline?: boolean }

/** `push` is a real branch's local-only commits going to its upstream — offered, never checked by default (the handoff carries them anyway).
 *  `env` is one .env file merged per key with the share, checked by default. */
export type Action = { id: string; label: string; hint: string; checked: boolean; checkout: Checkout } &
  ({ kind: "send" | "push"; unit: Unit } | { kind: "apply"; handoff: Handoff } | { kind: "env"; env: EnvState });
/** A situation cs sync must not decide alone: it is asked after the plan screen (src/sync.ts). `unit` is the dirty one;
 *  `sameBranch` — it is on the waiting handoff's branch, so "send mine over it" is a possible answer. */
export interface HandoffQuestion { kind: "dirty-vs-waiting"; checkout: Checkout; handoff: Handoff; unit: Unit; sameBranch: boolean; why: string }
/** A key of a .env file changed on both machines since the last sync — asked only when the file's row was chosen. */
export interface EnvQuestion { kind: "env-key"; env: EnvState; key: string; why: string }
export type Question = HandoffQuestion | EnvQuestion;
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

/** A keys-only file's merge names the keys without a value here; any other kind has none. */
const toFill = (e: EnvState): string[] => ("toFill" in e.merge ? (e.merge as { toFill: string[] }).toFill : []);

export function plan(facts: Facts[], machine: string): Plan {
  const actions: Action[] = [], questions: Question[] = [], skipped: string[] = [];
  for (const f of facts) {
    const name = f.checkout.project.name;
    handoffs(f, machine, actions, questions, skipped);
    // .env files travel through the share, not the project remote: their rows are independent of the handoff state.
    // Keys-only files are self-heal (nothing secret moves, no value is ever overwritten): no row, cs sync just does it.
    for (const e of f.env ?? []) {
      if (e.kind === "unignored") { skipped.push(`${name}: ${e.file} is not gitignored — not carried (add it to .gitignore)`); continue; }
      if (e.kind !== "values") continue;
      if (!e.merge.toLocal.length && !e.merge.toStore.length && !e.merge.conflicts.length) continue;
      actions.push({ id: `env:${name}:${e.file}`, kind: "env", checkout: f.checkout, env: e, label: `${name} · ${e.file}`, hint: describeMerge(e.merge, e.storedFrom), checked: true });
      for (const c of e.merge.conflicts) questions.push({ kind: "env-key", env: e, key: c.key,
        why: `${name} · ${e.file}: ${c.key} changed here and ${e.storedFrom ? `on ${e.storedFrom}` : "in the share"} since the last sync` });
    }
  }
  return { actions, questions, skipped };
}
/** The handoff half of the plan: applies, sends and real-branch pushes, per project. */
function handoffs(f: Facts, machine: string, actions: Action[], questions: Question[], skipped: string[]) {
  const c = f.checkout, name = c.project.name;
  if (!enabled(c.project)) { skipped.push(`${name}: handoff disabled`); return; }
  if (f.offline) { skipped.push(`${name}: remote unreachable — nothing sent or applied`); return; }
  const handled = new Set<string>();   // branches with an apply or a question: never also sent in the same run
  for (const w of f.waiting) {
    // plain layout: the root is the only unit and must be clean to check the branch out; worktrees: the branch's own worktree, if any
    const target = c.project.layout === "plain" ? c.units[0] : c.units.find((u) => u.branch === w.branch);
    if (c.project.layout === "plain" && !target) continue;
    if (target && target.dirty) {
      if (w.machine === machine && target.branch === w.branch) continue;   // my own earlier handoff; the dirty tree here is the newer copy and gets sent again
      handled.add(w.branch);
      questions.push({ kind: "dirty-vs-waiting", checkout: c, handoff: w, unit: target, sameBranch: target.branch === w.branch,
        why: `${name}: a handoff from ${w.machine} (${when(w.when)}) is waiting for ${w.branch}, but ${target.rel === "." ? "the checkout" : target.rel}${target.branch === w.branch ? "" : ` (on ${target.branch})`} has ${count(target.dirty, "uncommitted change")}` });
      continue;
    }
    handled.add(w.branch);
    actions.push({ id: `apply:${name}:${w.branch}`, kind: "apply", checkout: c, handoff: w, label: `${name} · ${w.branch}`,
      hint: `from ${w.machine}, ${when(w.when)}${w.note ? " — " + w.note : ""}`, checked: true });
  }
  for (const u of c.units) {
    if (u.skip) { skipped.push(`${name}${u.rel === "." ? "" : "/" + u.rel}: ${u.skip}`); continue; }
    if (!u.dirty && !u.unpushed) continue;
    const label = `${name} · ${u.branch}`;
    // the real branch: its own row, unchecked, independent of what happens to the handoff (ADR-0002: only this screen pushes it)
    const push: Action | undefined = u.unpushed ? { id: `push:${name}:${u.branch}`, kind: "push", checkout: c, unit: u, label, hint: `${count(u.unpushed, "unpushed commit")} → upstream`, checked: false } : undefined;
    if (handled.has(u.branch) || u.secrets?.length) {
      if (u.secrets?.length) skipped.push(`${label}: not sent — files that look secret: ${u.secrets.join(", ")}  (cs handoff --allow <glob>)`);
      if (push) actions.push(push);
      continue;
    }
    const own = f.waiting.some((w) => w.branch === u.branch && w.machine === machine);
    const bits = [u.dirty ? count(u.dirty, "change") : "", u.unpushed ? count(u.unpushed, "unpushed commit") : "", own ? "replaces the handoff sent from here earlier" : ""].filter(Boolean);
    actions.push({ id: `send:${name}:${u.branch}`, kind: "send", checkout: c, unit: u, label, hint: bits.join(", "), checked: true });
    if (push) actions.push(push);
  }
}

/** Bare cs: one project's facts as the bits of its status line. `pending` — cs sync would do or ask something here;
 *  `stuck` — dirty or unpushed work cs sync cannot carry (detached, on a handoff ref, files that look secret): the bit says what to do. */
export interface StatusBit { kind: "dirty" | "unpushed" | "waiting" | "env" | "offline" | "disabled" | "skip"; text: string }
export function status(f: Facts, machine: string): { bits: StatusBit[]; pending: boolean; stuck: boolean } {
  const bits: StatusBit[] = []; let stuck = false;
  for (const u of f.checkout.units) {
    const at = u.rel === "." ? "" : `${u.rel}: `;   // worktrees: the root is the row's branch, the others say where
    const work = u.dirty > 0 || u.unpushed > 0;
    if (u.dirty) bits.push({ kind: "dirty", text: `${at}${u.dirty} dirty` });
    if (u.unpushed) bits.push({ kind: "unpushed", text: `${at}↑${u.unpushed} unpushed` });
    if (u.skip) { bits.push({ kind: "skip", text: `${at}${u.skip}${work ? " — not carried by cs sync: check a branch out" : ""}` }); if (work) stuck = true; }
    if (u.secrets?.length) { bits.push({ kind: "skip", text: `${at}not sent — files that look secret: ${u.secrets.join(", ")} (cs handoff --allow <glob>)` }); stuck = true; }
  }
  let keys = false;   // a keys-only file with keys to take or store: self-heal, but only cs sync does it
  for (const e of f.env ?? []) {
    if (e.kind === "unignored") bits.push({ kind: "skip", text: `${e.file}: not gitignored — not carried (add it to .gitignore)` });
    else if (e.kind === "local") {
      const fill = toFill(e); const what = describeKeys({ ...e.merge, toFill: fill }, e.storedFrom); if (what) { bits.push({ kind: "env", text: `${e.file}: ${what}` }); keys = true; }
      if (fill.length) bits.push({ kind: "env", text: `${e.file}: ${count(fill.length, "key")} to fill in (${fill.join(", ")})` });
    } else if (e.kind === "values") { const what = describeMerge(e.merge, e.storedFrom); if (what) bits.push({ kind: "env", text: `${e.file}: ${what}` }); }
  }
  const here = f.checkout.units[0]?.branch;
  for (const w of f.waiting) bits.push({ kind: "waiting", text: `handoff waiting from ${w.machine}${w.branch === here ? "" : ` for ${w.branch}`} (${when(w.when)})` });
  if (f.offline) bits.push({ kind: "offline", text: "offline" });
  if (!enabled(f.checkout.project)) bits.push({ kind: "disabled", text: "handoff disabled" });
  const pl = plan([{ ...f, offline: false }], machine);   // offline: what cs sync would do once the remote is reachable again
  return { bits, pending: pl.actions.length > 0 || pl.questions.length > 0 || keys, stuck };
}
