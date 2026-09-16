/** Handoff notes when no -m is given: headless Claude reads a digest of the project's most recent session transcript
 *  and writes "where this stopped, what's next", under a spinner with a time cap (CS_NOTE_TIMEOUT seconds, default 60,
 *  per handoff). No transcript, no `claude` on PATH, CS_OFFLINE, a failure or the cap → a git-derived note: branch,
 *  changed files, last commit subject, session end time, and why there is no summary. A handoff always carries a note. */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import * as git from "./git.js";
import { claudeDir, stateDir } from "./paths.js";
import { claudeProjectKey } from "./import.js";
import type { Checkout } from "./checkout.js";
import { which } from "./deps.js";
import { exec } from "./proc.js";
import { count, when } from "./plan.js";

const PROMPT = "Below is a digest of a Claude Code session (USER / CLAUDE lines, → tool calls). The same person will resume this work on another machine. " +
  "Write their handoff note: 2 to 6 short plain-text lines, no headings, no preamble, no markdown. First line: where this stopped, in one sentence. " +
  "Then what is next, as concrete steps; name files, commands or failing tests only when they matter. If the digest is empty or says nothing about the work, reply with one line saying so.";
const DIGEST_MAX = 40_000;
const FILES_SHOWN = 8;
const noteTimeout = () => Math.max(1, parseInt(process.env.CS_NOTE_TIMEOUT ?? "", 10) || 60);
/** Text Claude Code injects into a session rather than the person typing it (slash-command echoes, task notifications…). */
const INJECTED = /^<(local-command|command-|task-notification|system-reminder|ide_)/;

/** Where a handoff's note came from — kept in the handoff so a re-send knows whether the old note was typed by hand. */
export type NoteSource = "explicit" | "claude" | "git";
export interface Note { note: string; source: NoteSource }

/** One tool call as one line: the argument a person would recognise (command, path, pattern…), clipped. */
function brief(input: unknown): string {
  const i = (input ?? {}) as Record<string, unknown>;
  const v = i.command ?? i.file_path ?? i.path ?? i.pattern ?? i.query ?? i.description ?? i.url ?? i.prompt ?? "";
  const s = (typeof v === "string" ? v : JSON.stringify(i)).replace(/\s+/g, " ").trim();
  return s.length > 160 ? s.slice(0, 159) + "…" : s;
}
const clean = (t: string) => t.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim();

/** The transcript (jsonl) as the text Claude reads: what was said and which tools ran — never tool output, thinking, meta
 *  lines or injected reminders. Longer than `max` bytes → the tail, with a first line saying the start was cut. */
export function digest(jsonl: string, max = DIGEST_MAX): string {
  const lines: string[] = [];
  const said = (who: string, text: unknown) => { const t = clean(String(text ?? "")); if (t && !INJECTED.test(t)) lines.push(`${who}: ${t}`); };
  for (const raw of jsonl.split("\n")) {
    let d: any; try { d = JSON.parse(raw); } catch { continue; }
    if ((d?.type !== "user" && d?.type !== "assistant") || d.isMeta || d.isSidechain) continue;
    const who = d.type === "user" ? "USER" : "CLAUDE"; const c = d.message?.content;
    if (typeof c === "string") said(who, c);
    else if (Array.isArray(c)) for (const b of c) { if (b?.type === "text") said(who, b.text); else if (b?.type === "tool_use") lines.push(`→ ${b.name}: ${brief(b.input)}`); }
  }
  let out = lines.join("\n");
  if (out.length > max) { const cut = out.length - max, nl = out.indexOf("\n", cut); out = "[earlier part of the session omitted]\n" + out.slice(nl < 0 ? cut : nl + 1); }
  return out;
}

/** "2026-09-16 15:08" in local time (plan.when formats an ISO string as is; a Z timestamp would read as UTC). */
const localTime = (iso: string) => { const d = new Date(iso); return when(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString()); };
export interface NoteFacts { branch: string; changed: string[]; subject: string; ended?: string; why: string }
/** The fallback note: one summary line (also the Cs-Note trailer), the files, and why there is no summary. */
export function gitNote(f: NoteFacts): string {
  const head = [f.branch, f.changed.length ? count(f.changed.length, "changed file") : "clean tree", f.subject ? `last commit "${f.subject}"` : "", f.ended ? `session ended ${localTime(f.ended)}` : ""].filter(Boolean).join(" · ");
  const files = f.changed.length > FILES_SHOWN ? [...f.changed.slice(0, FILES_SHOWN), `… ${f.changed.length - FILES_SHOWN} more`].join(", ") : f.changed.join(", ");
  return [head, files, `no summary: ${f.why}`].filter(Boolean).join("\n");
}

/** The newest session transcript Claude Code kept for any of `paths` (its projects directory, keyed by path). */
function latestTranscript(paths: string[]): { file: string; ended: string } | undefined {
  let best: { file: string; mtime: number } | undefined;
  for (const p of new Set(paths)) {
    const dir = join(claudeDir(), "projects", claudeProjectKey(p)); if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) { if (!f.endsWith(".jsonl")) continue; const mtime = statSync(join(dir, f)).mtimeMs; if (!best || mtime > best.mtime) best = { file: join(dir, f), mtime }; }
  }
  return best && { file: best.file, ended: new Date(best.mtime).toISOString() };
}

/** Claude's summary of the transcript, or the git-derived note with the reason. */
async function generate(unit: { path: string; branch: string }, t: { file: string; ended: string } | undefined): Promise<Note> {
  const changed = [...new Set([...git.out(["diff", "--name-only", "HEAD"], unit.path).split("\n"), ...git.out(["ls-files", "-o", "--exclude-standard"], unit.path).split("\n")].filter(Boolean))].sort();
  const facts: NoteFacts = { branch: unit.branch, changed, subject: git.out(["log", "-1", "--format=%s"], unit.path), ended: t?.ended, why: "" };
  const fallback = (why: string): Note => ({ note: gitNote({ ...facts, why }), source: "git" });
  if (!t) return fallback("no session transcript for this project");
  if (process.env.CS_OFFLINE) return fallback("offline");
  if (!which("claude")) return fallback("claude not on PATH");
  const text = digest(readFileSync(t.file, "utf8")); if (!text) return fallback("the session transcript is empty");
  const cap = noteTimeout();
  // --no-session-persistence and a cwd outside the project: the summary must not become the project's newest transcript
  mkdirSync(stateDir(), { recursive: true });
  const r = await exec("claude", ["-p", "--no-session-persistence", "--output-format", "text", PROMPT], { input: text, timeout: cap, group: true, cwd: stateDir() });
  if (r.code === 124) return fallback(`claude took longer than ${cap} s`);
  const note = r.out.trim();
  if (r.code !== 0 || !note) return fallback(`claude failed${r.err ? " — " + r.err.split("\n").filter(Boolean).pop() : ""}`);
  return { note, source: "claude" };
}

/** The note for a handoff about to be sent. `explicit` is -m and always wins. `earlier` is my own handoff being replaced:
 *  a note typed into it stays unless a session newer than it produced a Claude summary; a generated note is regenerated.
 *  The transcript is the unit's own when it has one (worktrees), else the project's newest. */
export async function pickNote(unit: { path: string; branch: string }, c: Checkout, explicit: string | undefined, earlier?: Note & { at: string }): Promise<Note> {
  if (explicit) return { note: explicit, source: "explicit" };
  const typed = earlier?.source === "explicit" && earlier.note ? earlier : undefined;
  const t = latestTranscript([unit.path]) ?? latestTranscript([...new Set([c.container, c.root, ...c.units.map((u) => u.path)])]);
  if (typed && !(t && t.ended > typed.at)) return { note: typed.note, source: "explicit" };   // nothing newer to summarise
  const g = await generate(unit, t);
  return typed && g.source === "git" ? { note: typed.note, source: "explicit" } : g;
}
