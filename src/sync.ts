/** cs sync — the one daily verb. One run: pull the share and self-heal (never asks) → clone what is missing → gather
 *  facts per project → plan (src/plan.ts, pure) → plan screen (one multi-select, one confirmation) → execute → push
 *  the share → summary. Direction is never asked: waiting handoffs are applied and dirty work is sent in the same run.
 *  Only the plan screen touches a project remote (ADR-0002). */
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as git from "./git.js";
import { stateDir } from "./paths.js";
import type { Machine } from "./machine.js";
import { checkoutRoot, loadManifest, selectedProjects, workspace, type Manifest } from "./manifest.js";
import { applyGit, applyLinks, applySettings, applyShellRc } from "./apply.js";
import { checkouts, syncProject } from "./link.js";
import { hooksStatus, installHooks, installTimer } from "./hooks.js";
import { describe, newest, shareGitSync, type Side, type SyncOpts as ShareOpts } from "./sharesync.js";
import { clone } from "./projects.js";
import { backupRef, denyHits, enabled, fetchHandoffs, handoff, REF_NS, resume, units, userSlug, type Handoff } from "./handoff.js";
import { count, plan, when, type Action, type Answer, type Facts, type Plan, type Question } from "./plan.js";
import * as ui from "./ui.js";

export interface SyncOpts { note?: string; timeout?: number }
export interface SyncResult { rc: number; summary: string }

// ---------------------------------------------------------------- one cs sync at a time (a timer tick and a manual run must never race)
const lockFile = () => join(stateDir(), "sync.lock");
const alive = (pid: number) => { try { process.kill(pid, 0); return true; } catch { return false; } };
function lock(): boolean {
  mkdirSync(stateDir(), { recursive: true });
  const take = () => { const fd = openSync(lockFile(), "wx"); writeFileSync(fd, String(process.pid)); closeSync(fd); };
  try { take(); } catch {
    let pid = NaN; try { pid = parseInt(readFileSync(lockFile(), "utf8"), 10); } catch {}
    if (pid && alive(pid)) return false;
    try { unlinkSync(lockFile()); take(); } catch { return false; }   // a crashed run left it behind
  }
  const release = () => { try { if (parseInt(readFileSync(lockFile(), "utf8"), 10) === process.pid) unlinkSync(lockFile()); } catch {} };
  process.on("exit", release);   // also runs on Ctrl-C at a prompt (clack exits the process)
  return true;
}

// ---------------------------------------------------------------- gather: observe, decide nothing
async function gather(m: Machine, man: Manifest, timeout: number): Promise<{ facts: Facts[]; handoffs: Record<string, Handoff[]> }> {
  const ws = workspace(man, m); const facts: Facts[] = []; const handoffs: Record<string, Handoff[]> = {};
  for (const p of selectedProjects(man, m)) {
    const root = checkoutRoot(p, ws);
    if (!existsSync(root) || !git.isRepo(root) || !git.remoteUrl(root)) continue;   // missing → clone reported it; no remote → cs doctor's business
    const f: Facts = { project: p.name, layout: p.layout, units: [], waiting: [] };
    facts.push(f);
    if (!enabled(p)) { f.disabled = true; continue; }
    const r = await ui.spin(`${p.name}: fetching…`, () => fetchHandoffs(root, userSlug(root), timeout));
    if (!r.ok) { f.offline = true; continue; }
    handoffs[p.name] = r.list;
    f.waiting = r.list.map((h) => ({ branch: h.branch, machine: h.machine, when: h.when, note: h.note, ref: h.ref }));
    for (const w of f.waiting) ui.step(`${p.name} · ${w.branch}  handoff waiting from ${w.machine} (${when(w.when)})`);
    for (const u of units(p, ws)) {
      const dirty = git.dirtyCount(u.path); const unpushed = git.aheadBehind(u.path)?.[0] ?? 0;
      const skip = !u.branch ? "detached HEAD" : u.branch.startsWith(`${REF_NS}/`) ? "on a handoff ref" : undefined;
      f.units.push({ rel: u.rel, branch: u.branch, dirty, unpushed, skip, secrets: dirty && !skip ? denyHits(u.path, p, []) : undefined });
      if ((dirty || unpushed) && !skip) ui.step(`${p.name} · ${u.branch}  ${[dirty ? count(dirty, "change") : "", unpushed ? count(unpushed, "unpushed commit") : ""].filter(Boolean).join(", ")}`);
    }
  }
  return { facts, handoffs };
}

// ---------------------------------------------------------------- plan screen: one multi-select, a summary, one confirmation
const GROUP: Record<Action["kind"], string> = { send: "handoffs to send", apply: "handoffs to apply" };
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
  const once = (t: string, extra: ShareOpts) => ui.group(t, async () => { copyBack(); const r = await shareGitSync(repo, "config", m.name, { ...opts, ...extra, ask: ui.canAsk() }); if (r.offline) ui.step("offline — local changes wait for the next sync"); return r; }, { done });
  let r = await once(title, {}); const answers: Record<string, Side> = {};
  while (r.conflicts?.length) {   // memory/plan *.md never get here (merge=union); the rebase was aborted, nothing changed yet
    for (const c of r.conflicts) answers[c.file] = await ui.select(`${c.file} changed on both machines — keep which version?`,
      [{ value: "ours" as Side, label: "this machine's version", hint: describe(c.ours) }, { value: "theirs" as Side, label: "the other machine's version", hint: describe(c.theirs) }], newest(c));
    r = await once("share settled", { resolve: answers });
  }
  return r;
}

// ---------------------------------------------------------------- dirty tree vs waiting handoff: asked per question after the plan screen; nothing is ever destructive
async function askQuestions(qs: Question[]): Promise<{ q: Question; answer: Answer }[]> {
  const out: { q: Question; answer: Answer }[] = [];
  for (const q of qs) {
    if (!ui.canAsk()) { ui.warn(`${q.why}\n${ui.cyan("→ ")}kept local, the handoff stays waiting — run cs sync in a terminal to choose`); out.push({ q, answer: "keep" }); continue; }
    const options: { value: Answer; label: string; hint: string }[] = [
      { value: "keep", label: "keep mine, leave the handoff waiting", hint: "nothing moves; asked again next sync" },
      { value: "apply", label: `apply the handoff from ${q.machine}`, hint: "my changes here go to a backup ref" },
      ...(q.sameBranch ? [{ value: "send" as Answer, label: "send mine over it", hint: "the waiting handoff goes to a backup ref, then my changes replace it" }] : [])];
    const answer = await ui.select(`${q.why} — what now?`, options, "keep");
    if (answer === "keep") ui.skip(`${q.project} · ${q.branch}: kept local — the handoff from ${q.machine} stays waiting`);
    out.push({ q, answer });
  }
  return out;
}

// ---------------------------------------------------------------- the run
export async function runSync(repo: string, m: Machine, man: Manifest, o: SyncOpts = {}): Promise<SyncResult> {
  if (!lock()) throw new Error("cs: another cs sync is running here — wait for it to finish");
  const timeout = o.timeout ?? 20; let rc = 0;
  const copyBack = () => { const ws = workspace(man, m); for (const p of selectedProjects(man, m)) if (checkouts(p, ws).length) syncProject(repo, p, ws); };

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
    for (const p of selectedProjects(man, m)) if (checkouts(p, ws).length) for (const c of syncProject(repo, p, ws)) changes.push(`${p.name}: ${c}`);
    for (const c of changes) ui.step(c);
  }, { done: "nothing to repair" });

  // 3. projects selected for this machine that are not here yet
  const before = new Set(selectedProjects(man, m).filter((p) => existsSync(checkoutRoot(p, ws))).map((p) => p.name));
  if (await ui.group("cloned", () => clone(repo, m, man, []), { done: "nothing missing" })) rc = rc || 1;
  const cloned = selectedProjects(man, m).filter((p) => !before.has(p.name) && existsSync(checkoutRoot(p, ws))).length;

  // 4. gather → 5. plan → 6. plan screen
  const { facts, handoffs } = await ui.group("projects checked", () => gather(m, man, timeout), { done: "all clean, nothing waiting" });
  const pl = plan(facts, m.name);
  for (const s of pl.skipped) ui.skip(s);
  let chosen: Action[] = [];
  const unreachable = facts.filter((f) => f.offline).length;
  if (pl.actions.length) chosen = await planScreen(pl); else if (!pl.questions.length) ui.info(ui.dim(unreachable ? `nothing moved — ${unreachable} remote(s) unreachable` : "nothing to move — no handoffs waiting, nothing stale here"));
  const answered = await askQuestions(pl.questions);
  const kept = answered.filter((a) => a.answer === "keep").length;

  // 7. execute: send what is dirty here, then apply what is waiting (the local tree is clean, the plan checked). Sends go
  //    first because applying may check another branch out in a plain-layout checkout. Counts come from what actually happened.
  //    Answered questions run in the same groups: "send" replaces the other machine's handoff (kept in a backup ref first),
  //    "apply" replaces the local changes (kept in a backup ref by resume).
  const notes: string[][] = []; let applied = 0, sent = 0;
  const per = (kind: Action["kind"]) => { const by = new Map<string, string[]>(); for (const a of chosen) if (a.kind === kind) by.set(a.project, [...(by.get(a.project) ?? []), a.branch]); return by; };
  const sends = per("send"), applies = per("apply");
  const over = answered.filter((a) => a.answer === "send"), replace = answered.filter((a) => a.answer === "apply");
  if (sends.size || over.length) await ui.group("handoffs sent", async () => {
    for (const [name, branches] of sends) await handoff(repo, m, man, [man.projects[name]], { branches, note: o.note, onDone: () => sent++ });
    for (const { q } of over) {
      const h = handoffs[q.project]?.find((x) => x.branch === q.branch); const unit = units(man.projects[q.project], ws).find((u) => u.rel === q.unit);
      if (!h || !unit) { ui.fail(`${q.project} · ${q.branch}: could not back the waiting handoff up — not sent`); continue; }   // never overwrite without the backup
      ui.step(`${q.project} · ${q.branch}: handoff from ${q.machine} backed up to ${backupRef(unit.path, q.branch, h.sha)}`);
      await handoff(repo, m, man, [man.projects[q.project]], { branches: [q.branch], note: o.note, overwrite: true, onDone: () => sent++ });
    }
  });
  if (applies.size || replace.length) await ui.group("handoffs applied", async () => {
    const onNote = (p: string, from: string, note: string) => notes.push([`${p} — note from ${from}`, ...note.trim().split("\n")]);
    for (const [name, branches] of applies) await resume(repo, m, man, [man.projects[name]], { branches, waiting: handoffs, onDone: () => applied++, onNote });
    for (const { q } of replace) await resume(repo, m, man, [man.projects[q.project]], { branches: [q.branch], waiting: handoffs, replace: true, onDone: () => applied++, onNote });
  });
  for (const [title, ...lines] of notes) ui.note(lines, title);
  const failed = chosen.length + over.length + replace.length - sent - applied;
  if (failed) rc = rc || 1;

  // 8. the share again: what the run changed (project state, handoff notes, memory) goes out
  const last = await syncShare(repo, m, "share pushed", first.offline ? "committed locally — offline, pushed by the next sync" : "already in sync", copyBack, { timeout, commitOnly: first.offline });
  if (!last.ok) rc = 2;

  const bits = [applied ? `${applied} handoff(s) applied` : "", sent ? `${sent} handoff(s) sent` : "", cloned ? `${cloned} project(s) cloned` : "", kept ? ui.yellow(`${kept} handoff(s) left waiting — see above`) : ""].filter(Boolean);
  const summary = rc === 2 ? ui.red("share not synced — see above") : failed ? ui.red(`${failed} action(s) failed — see above`) : bits.length ? bits.join(" · ") : ui.dim(first.offline || last.offline ? "offline — local parts done, nothing moved" : "nothing to move");
  return { rc, summary };
}
