/** cs sync — the one daily verb. One run: pull the share and self-heal (never asks) → clone what is missing → gather
 *  facts per project → plan (src/plan.ts, pure) → plan screen (one multi-select, one confirmation) → execute → push
 *  the share → summary. Direction is never asked: waiting handoffs are applied and dirty work is sent in the same run.
 *  Only the plan screen touches a project remote (ADR-0002). */
import { acquire } from "./lock.js";
import type { Machine } from "./machine.js";
import { loadManifest, selectedProjects, workspace, type Manifest } from "./manifest.js";
import { applyGit, applyLinks, applySettings, applyShellRc } from "./apply.js";
import { runLink, sweepRemoved, syncProject } from "./link.js";
import { hooksStatus, installHooks, installTimer } from "./hooks.js";
import { describe, newest, shareGitSync, type Side, type SyncOpts as ShareOpts } from "./sharesync.js";
import { clone } from "./projects.js";
import { apply, dirs, locate, present, push, send } from "./checkout.js";
import { gather } from "./gather.js";
import { getBackend } from "./secrets/index.js";
import { applyEnv, newestSide, snapshotInSync, type EnvState } from "./envfiles.js";
import { describeKeys, describeMerge, type Side as EnvSide } from "./env.js";
import { count, plan, when, type Action, type Answer, type EnvQuestion, type Facts, type HandoffQuestion, type Plan } from "./plan.js";
import * as ui from "./ui.js";

export interface SyncOpts { note?: string; timeout?: number }
export interface SyncResult { rc: number; summary: string }

// ---------------------------------------------------------------- gather (src/gather.ts) + the lines it earns under "projects checked"
function report(facts: Facts[]) {
  for (const f of facts) {
    const name = f.checkout.project.name;
    for (const w of f.waiting) ui.step(`${name} · ${w.branch}  handoff waiting from ${w.machine} (${when(w.when)})`);
    for (const u of f.checkout.units) if ((u.dirty || u.unpushed) && !u.skip) ui.step(`${name} · ${u.branch}  ${[u.dirty ? count(u.dirty, "change") : "", u.unpushed ? count(u.unpushed, "unpushed commit") : ""].filter(Boolean).join(", ")}`);
    for (const e of f.env ?? []) if (e.kind === "values" || e.kind === "local") { const what = e.kind === "local" ? describeKeys({ toFill: [], ...e.merge }, e.storedFrom) : describeMerge(e.merge, e.storedFrom); if (what) ui.step(`${name} · ${e.file}  ${what}`); }
  }
}

// ---------------------------------------------------------------- plan screen: one multi-select, a summary, one confirmation
const GROUP: Record<Action["kind"], string> = { send: "handoffs to send", apply: "handoffs to apply", push: "branches to push", env: ".env files to store or update" };
async function planScreen(pl: Plan): Promise<Action[]> {
  const byId = new Map(pl.actions.map((a) => [a.id, a]));
  let picked = new Set(pl.actions.filter((a) => a.checked).map((a) => a.id));
  const summary = (ids: Set<string>) => pl.actions.map((a) => (ids.has(a.id) ? ui.green("✓ ") : ui.dim("○ ")) + `${a.kind.padEnd(5)} ${a.label}  ${ui.dim(a.hint)}`);
  if (!ui.canAsk()) { ui.note(summary(picked), `${picked.size} of ${pl.actions.length} actions (defaults — no terminal to ask)`); return pl.actions.filter((a) => picked.has(a.id)); }
  const groups: Record<string, { value: string; label: string; hint?: string }[]> = {};
  for (const a of pl.actions) (groups[GROUP[a.kind]] ??= []).push({ value: a.id, label: a.label, hint: a.hint });
  for (;;) {
    picked = new Set((await ui.groupMultiselect("What should cs sync do?", groups, [...picked])).filter((v) => byId.has(v)));   // whole-group picks return the group label too
    ui.note(summary(picked), `${picked.size} of ${pl.actions.length} actions`);
    if (await ui.proceed("proceed?", "Yes, continue", "Change selection")) break;
  }
  return pl.actions.filter((a) => picked.has(a.id));
}

// ---------------------------------------------------------------- share conflicts: asked per file, outside the spinner, then the rebase is settled and finished
async function syncShare(repo: string, m: Machine, title: string, done: string, copyBack: () => void, opts: ShareOpts) {
  const once = (t: string, extra: ShareOpts) => ui.group(t, async () => { copyBack(); const r = await shareGitSync(repo, "share", m.name, { ...opts, ...extra, ask: ui.canAsk() }); if (r.offline) ui.step("offline — local changes wait for the next sync"); return r; }, { done });
  let r = await once(title, {}); const answers: Record<string, Side> = {};
  while (r.conflicts?.length) {   // memory/plan *.md never get here (merge=union); the rebase was aborted, nothing changed yet
    for (const c of r.conflicts) answers[c.file] = await ui.select(`${c.file} changed on both machines — keep which version?`,
      [{ value: "ours" as Side, label: "this machine's version", hint: describe(c.ours) }, { value: "theirs" as Side, label: "the other machine's version", hint: describe(c.theirs) }], newest(c));
    r = await once("share settled", { resolve: answers });
  }
  return r;
}

// ---------------------------------------------------------------- dirty tree vs waiting handoff: asked per question after the plan screen; nothing is ever destructive
async function askQuestions(qs: HandoffQuestion[]): Promise<{ q: HandoffQuestion; answer: Answer }[]> {
  const out: { q: HandoffQuestion; answer: Answer }[] = [];
  for (const q of qs) {
    if (!ui.canAsk()) { ui.warn(`${q.why}\n${ui.cyan("→ ")}kept local, the handoff stays waiting — run cs sync in a terminal to choose`); out.push({ q, answer: "keep" }); continue; }
    const options: { value: Answer; label: string; hint: string }[] = [
      { value: "keep", label: "keep mine, leave the handoff waiting", hint: "nothing moves; asked again next sync" },
      { value: "apply", label: `apply the handoff from ${q.handoff.machine}`, hint: "my changes here go to a backup ref" },
      ...(q.sameBranch ? [{ value: "send" as Answer, label: "send mine over it", hint: "the waiting handoff goes to a backup ref, then my changes replace it" }] : [])];
    const answer = await ui.select(`${q.why} — what now?`, options, "keep");
    if (answer === "keep") ui.skip(`${q.checkout.project.name} · ${q.handoff.branch}: kept local — the handoff from ${q.handoff.machine} stays waiting`);
    out.push({ q, answer });
  }
  return out;
}

// ---------------------------------------------------------------- a .env key changed on both machines since the last sync: asked per key (ADR-0003); no terminal → newest wins
const mask = (v: string | undefined) => (v === undefined ? "removed" : v.length > 8 ? v.slice(0, 3) + "…" + v.slice(-2) : "…");
async function askEnvKeys(qs: EnvQuestion[]): Promise<Map<EnvState, Partial<Record<string, EnvSide>>>> {
  const out = new Map<EnvState, Partial<Record<string, EnvSide>>>();
  for (const q of qs) {
    const st = q.env; const c = st.merge.conflicts.find((x) => x.key === q.key); if (!c) continue;
    const other = st.storedFrom ? `${st.storedFrom}'s value` : "the share's value"; const newest = newestSide(st);
    let side: EnvSide;
    if (!ui.canAsk()) { side = newest; ui.warn(`${q.why}\n${ui.cyan("→ ")}newest kept: ${side === "local" ? "this machine's value" : other} — run cs sync in a terminal to choose`); }
    else side = await ui.select(`${q.why} — keep which value?`, [
      { value: "local" as EnvSide, label: "this machine's value", hint: `${mask(c.local)}${st.localWhen ? `, changed ${when(st.localWhen)}` : ""}` },
      { value: "stored" as EnvSide, label: other, hint: `${mask(c.stored)}${st.storedWhen ? `, stored ${when(st.storedWhen)}` : ""}` }], newest);
    ui.step(`${st.project} · ${st.file}: ${q.key} — ${side === "local" ? "this machine's value kept" : `${other} taken`}`);
    if (!out.has(st)) out.set(st, {}); out.get(st)![q.key] = side;
  }
  return out;
}

// ---------------------------------------------------------------- the run
export async function runSync(repo: string, m: Machine, man: Manifest, o: SyncOpts = {}): Promise<SyncResult> {
  // one cs sync at a time (a timer tick and a manual run must never race); released on exit, which Ctrl-C at a prompt also is
  const release = acquire(); if (!release) throw new Error("cs: another cs sync is running here (or the hooks' share sync, a few seconds) — wait for it to finish");
  process.on("exit", release);
  const timeout = o.timeout ?? 20; let rc = 0;
  const copyBack = () => { const ws = workspace(man, m); for (const p of selectedProjects(man, m)) if (dirs(p, ws).length) syncProject(repo, p, ws); };

  // 1. the share: newest memory/plans/settings in, other machines' changes out
  const first = await syncShare(repo, m, "share synced", "already in sync", copyBack, { timeout });
  if (!first.ok) rc = 2;
  man = loadManifest(repo); const ws = workspace(man, m);   // the pull may have changed the manifest

  // 2. self-heal, never a question: hooks, timer, ~/.claude, git includes, shell rc, project state in every checkout
  await ui.group("repaired", async () => {
    const hs = hooksStatus(repo);
    if (!hs.complete) { installHooks(repo, m); ui.step("Claude Code hooks re-installed"); }
    if (!hs.timerFiles || (hs.timerSupported && !hs.timerActive)) ui.step(`timer: ${await installTimer()}`);
    const changes: string[] = []; applySettings(repo, m, false, changes); applyLinks(repo, false, changes); applyGit(man, false, changes); applyShellRc(false, changes);
    for (const p of selectedProjects(man, m)) if (dirs(p, ws).length) for (const c of syncProject(repo, p, ws)) changes.push(`${p.name}: ${c}`);
    changes.push(...sweepRemoved(man, ws));   // a project removed from the share on another machine: its checkout here loses the pointer we wrote
    for (const c of changes) ui.step(c);
  }, { done: "nothing to repair" });

  // 3. projects selected for this machine that are not here yet
  const missing = (): Set<string> => new Set(selectedProjects(man, m).filter((p) => { const c = locate(p, ws); return !present(c) && c.why === "missing"; }).map((p) => p.name));
  const before = missing();
  if (await ui.group("cloned", () => clone(repo, m, man, []), { done: "nothing missing" })) rc = rc || 1;
  const after = missing(); const cloned = [...before].filter((n) => !after.has(n)).length;

  // 4. gather → 5. plan → 6. plan screen
  const { facts, envSkipped } = await ui.group("projects checked", async () => { const g = await gather(repo, m, man, { timeout }); report(g.facts); return g; }, { done: "all clean, nothing waiting" });
  const pl = plan(facts, m.name);
  for (const s of pl.skipped) ui.skip(s);
  for (const s of envSkipped) ui.skip(s);
  let chosen: Action[] = [];
  const unreachable = facts.filter((f) => f.offline).length;
  if (pl.actions.length) chosen = await planScreen(pl); else if (!pl.questions.length) ui.info(ui.dim(unreachable ? `nothing moved — ${unreachable} remote(s) unreachable` : "nothing to move — no handoffs waiting, nothing stale here"));
  const answered = await askQuestions(pl.questions.filter((q): q is HandoffQuestion => q.kind === "dirty-vs-waiting"));
  const kept = answered.filter((a) => a.answer === "keep").length;
  const envRows = chosen.filter((a): a is Action & { kind: "env" } => a.kind === "env");
  const decided = await askEnvKeys(pl.questions.filter((q): q is EnvQuestion => q.kind === "env-key" && envRows.some((a) => a.env === q.env)));

  // 7. execute: send what is dirty here, then apply what is waiting (the local tree is clean, the plan checked). Sends go
  //    first because applying may check another branch out in a plain-layout checkout. Counts come from what actually happened.
  //    Answered questions run in the same groups: "send" replaces the other machine's handoff (the verb keeps it in a backup ref),
  //    "apply" replaces the local changes (kept in a backup ref the same way). Each action runs on the unit or handoff the plan saw.
  const notes: string[][] = []; let applied = 0, sent = 0;
  const sends = chosen.filter((a): a is Action & { kind: "send" } => a.kind === "send"), applies = chosen.filter((a): a is Action & { kind: "apply" } => a.kind === "apply");
  const over = answered.filter((a) => a.answer === "send").map((a) => a.q), replace = answered.filter((a) => a.answer === "apply").map((a) => a.q);
  if (sends.length || over.length) await ui.group("handoffs sent", async () => {
    for (const a of sends) if ((await send(a.checkout, a.unit, m, { note: o.note })).ok) sent++;
    for (const q of over) if ((await send(q.checkout, q.unit, m, { note: o.note, over: q.handoff })).ok) sent++;
  });
  if (applies.length || replace.length) await ui.group("handoffs applied", async () => {
    const one = async (a: { checkout: Facts["checkout"]; handoff: HandoffQuestion["handoff"] }, replace: boolean) => {
      const r = await apply(a.checkout, a.handoff, m, { replace }); if (!r.ok) return; applied++;
      const wasQuiet = ui.isQuiet(); ui.setQuiet(true); try { runLink(repo, m, man, [a.checkout.project.name]); } finally { ui.setQuiet(wasQuiet); }   // project state into the unit (a new worktree has none yet)
      if (r.note) notes.push([`${a.checkout.project.name} — note from ${a.handoff.machine}`, ...r.note.trim().split("\n")]);
    };
    for (const a of applies) await one(a, false);
    for (const q of replace) await one(q, true);
  });
  for (const [title, ...lines] of notes) ui.note(lines, title);
  // real branches last, only the rows ticked on the plan screen, each to its own upstream, never forced (ADR-0002)
  let pushed = 0; const pushes = chosen.filter((a): a is Action & { kind: "push" } => a.kind === "push");
  if (pushes.length) await ui.group("branches pushed", async () => { for (const a of pushes) if ((await push(a.checkout, a.unit)).ok) pushed++; });
  // .env files: the rows ticked are merged per key with the share (encrypted through the secrets backend) and patched in place here (ADR-0003);
  // keys-only files (.env.local) are merged without a row — nothing secret moves and no value is overwritten; a key new here says so.
  // Files already the same on both sides get their snapshot so the next change is known to be one-sided.
  let envDone = 0; const states = facts.flatMap((f) => f.env ?? []);
  const keysOnly = states.filter((st) => st.kind === "local" && (st.merge.toLocal.length || st.merge.toStore.length));
  if (envRows.length || keysOnly.length) await ui.group(".env files", async () => {
    const b = await getBackend(m);
    const one = async (label: string, st: EnvState, decide: Partial<Record<string, EnvSide>>) => {
      try { const r = await applyEnv(repo, b, st, decide); envDone++;
        ui.step(`${label}: ${[r.stored ? `${count(r.stored, "key")} stored` : "", r.local ? `${count(r.local, "key")} taken${st.storedFrom ? ` from ${st.storedFrom}` : ""}` : ""].filter(Boolean).join(", ")}${r.toFill.length ? ui.yellow(` — to fill in: ${r.toFill.join(", ")}`) : ""}`); }
      catch (e: any) { ui.fail(`${label}: ${String(e?.message ?? e).replace(/^cs: /, "")}`); }
    };
    for (const a of envRows) await one(a.label, a.env, decided.get(a.env) ?? {});
    for (const st of keysOnly) await one(`${st.project} · ${st.file}`, st, {});
  });
  for (const st of states) snapshotInSync(st);
  const failed = chosen.length + over.length + replace.length + keysOnly.length - sent - applied - pushed - envDone;
  if (failed) rc = rc || 1;

  // 8. the share again: what the run changed (project state, handoff notes, memory) goes out
  const last = await syncShare(repo, m, "share pushed", first.offline ? "committed locally — offline, pushed by the next sync" : "already in sync", copyBack, { timeout, commitOnly: first.offline });
  if (!last.ok) rc = 2;

  const bits = [applied ? `${applied} handoff(s) applied` : "", sent ? `${sent} handoff(s) sent` : "", pushed ? `${pushed} branch(es) pushed` : "", envDone ? `${envDone} .env file(s) merged` : "", cloned ? `${cloned} project(s) cloned` : "", kept ? ui.yellow(`${kept} handoff(s) left waiting — see above`) : ""].filter(Boolean);
  const summary = rc === 2 ? ui.red("share not synced — see above") : failed ? ui.red(`${failed} action(s) failed — see above`) : bits.length ? bits.join(" · ") : ui.dim(first.offline || last.offline ? "offline — local parts done, nothing moved" : "nothing to move");
  return { rc, summary };
}
