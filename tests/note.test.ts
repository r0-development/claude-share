/** The handoff note's decision table, with plain functions as the transcript, the summariser and the git facts. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { liveSources, pickNote, type Note, type NoteSources } from "../src/note.ts";
import type { Checkout } from "../src/checkout.ts";

const unit = { path: "/w/one", branch: "feat/x" };
const c: Checkout = { project: { name: "one" } as Checkout["project"], container: "/w/one", root: "/w/one", units: [{ ...unit, rel: ".", dirty: 1, unpushed: 0 }] };
const line = (o: unknown) => JSON.stringify(o) + "\n";
const SESSION = line({ type: "user", message: { role: "user", content: "implement the widget" } }) + line({ type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "Wiring it." }] } });

/** Sources that record what was asked of them. `transcript` is the session Claude Code kept (undefined: none); `summary` is what the summariser answers. */
function fake(o: { transcript?: { ended: string; text: string }; summary?: { note: string } | { why: string } } = {}) {
  const asked: string[] = [];
  const s: NoteSources = {
    transcript: () => o.transcript && { ended: o.transcript.ended, read: () => o.transcript!.text },
    summarise: async (digest) => { asked.push(digest); return o.summary ?? { why: "no summariser" }; },
    facts: () => ({ changed: ["README", "src/a.ts"], subject: "add a" }),
  };
  return { s, asked };
}
const typed = (at: string): Note & { at: string } => ({ note: "typed by hand", source: "explicit", at });
const generated = (at: string): Note & { at: string } => ({ note: "Stopped: earlier summary.", source: "claude", at });
const T1 = "2026-09-16T10:00:00.000Z", T2 = "2026-09-16T12:00:00.000Z";

test("note: -m always wins — nothing is read, nobody is asked", async () => {
  const { s, asked } = fake({ transcript: { ended: T2, text: SESSION }, summary: { note: "a summary" } });
  assert.deepEqual(await pickNote(unit, c, "typed now", typed(T1), s), { note: "typed now", source: "explicit" });
  assert.deepEqual(asked, []);
});

test("note: a session transcript → the summariser's answer is the note, fed the digest of the transcript", async () => {
  const { s, asked } = fake({ transcript: { ended: T2, text: SESSION }, summary: { note: "Stopped: widget half wired.\nNext: tests." } });
  assert.deepEqual(await pickNote(unit, c, undefined, undefined, s), { note: "Stopped: widget half wired.\nNext: tests.", source: "claude" });
  assert.deepEqual(asked, ["USER: implement the widget\nCLAUDE: Wiring it."]);
});

test("note: no transcript → the git-derived note says so; the summariser is never asked and no session end is named", async () => {
  const { s, asked } = fake();
  const n = await pickNote(unit, c, undefined, undefined, s);
  assert.equal(n.source, "git");
  assert.equal(n.note, 'feat/x · 2 changed files · last commit "add a"\nREADME, src/a.ts\nno summary: no session transcript for this project');
  assert.deepEqual(asked, []);
});

test("note: a transcript with nothing said in it → git-derived, saying the transcript is empty; the summariser is never asked", async () => {
  const { s, asked } = fake({ transcript: { ended: T2, text: line({ type: "progress" }) + "not json\n" } });
  const n = await pickNote(unit, c, undefined, undefined, s);
  assert.equal(n.source, "git"); assert.match(n.note, /no summary: the session transcript is empty$/);
  assert.deepEqual(asked, []);
});

test("note: the summariser's reason (offline, no claude, the cap, a failure) → git-derived, with the session end and the reason", async () => {
  const { s } = fake({ transcript: { ended: T2, text: SESSION }, summary: { why: "claude took longer than 1 s" } });
  const n = await pickNote(unit, c, undefined, undefined, s);
  assert.equal(n.source, "git");
  assert.match(n.note, /^feat\/x · 2 changed files · last commit "add a" · session ended 2026-09-16 \d\d:\d\d\n/);
  assert.match(n.note, /\nno summary: claude took longer than 1 s$/);
});

test("note: a typed note on the handoff being replaced stays while no session is newer than it — the summariser is not asked", async () => {
  const { s, asked } = fake({ transcript: { ended: T1, text: SESSION }, summary: { note: "a summary" } });
  assert.deepEqual(await pickNote(unit, c, undefined, typed(T2), s), { note: "typed by hand", source: "explicit" });
  assert.deepEqual(await pickNote(unit, c, undefined, typed(T1), s), { note: "typed by hand", source: "explicit" });   // same instant: not newer
  const none = fake({ summary: { note: "a summary" } });
  assert.deepEqual(await pickNote(unit, c, undefined, typed(T1), none.s), { note: "typed by hand", source: "explicit" });
  assert.deepEqual([...asked, ...none.asked], []);
});

test("note: a session newer than the typed note → the summary replaces it; when the summariser cannot, the typed note outlives a git-derived one", async () => {
  const ok = fake({ transcript: { ended: T2, text: SESSION }, summary: { note: "a newer summary" } });
  assert.deepEqual(await pickNote(unit, c, undefined, typed(T1), ok.s), { note: "a newer summary", source: "claude" });
  const failing = fake({ transcript: { ended: T2, text: SESSION }, summary: { why: "claude not on PATH" } });
  assert.deepEqual(await pickNote(unit, c, undefined, typed(T1), failing.s), { note: "typed by hand", source: "explicit" });
  assert.equal(failing.asked.length, 1);   // it was tried
});

test("note: an earlier generated note is regenerated, newer session or not; an earlier empty typed note counts as none", async () => {
  const { s, asked } = fake({ transcript: { ended: T1, text: SESSION }, summary: { note: "regenerated" } });
  assert.deepEqual(await pickNote(unit, c, undefined, generated(T2), s), { note: "regenerated", source: "claude" });
  assert.deepEqual(await pickNote(unit, c, undefined, { ...typed(T2), note: "" }, s), { note: "regenerated", source: "claude" });
  assert.equal(asked.length, 2);
});

test("note: the live summariser refuses before starting claude when offline or when claude is not on PATH", async () => {
  const env = { ...process.env };
  try {
    process.env.CS_OFFLINE = "1"; assert.deepEqual(await liveSources.summarise("USER: hi"), { why: "offline" });
    delete process.env.CS_OFFLINE; process.env.PATH = "/nonexistent"; process.env.HOME = "/nonexistent";
    assert.deepEqual(await liveSources.summarise("USER: hi"), { why: "claude not on PATH" });
  } finally { process.env.CS_OFFLINE = env.CS_OFFLINE; if (!env.CS_OFFLINE) delete process.env.CS_OFFLINE; process.env.PATH = env.PATH; process.env.HOME = env.HOME; }
});
