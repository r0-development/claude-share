/** The hooks transform at its seam: a settings object in, a settings object out, nothing on disk. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { HOOK_EVENTS, withCsHooks } from "../src/hooks.ts";

const cmd = (command: string) => ({ hooks: [{ type: "command", command }] });
const commands = (s: any, ev: string): string[] => (s.hooks?.[ev] ?? []).flatMap((e: any) => e.hooks.map((h: any) => h.command));
const LINT = cmd("eslint --fix");

test("hooks: install adds the cs share-sync hooks to every event and leaves the rest of the settings alone", () => {
  const before = { theme: "dark", hooks: { Stop: [LINT] } };
  const after: any = withCsHooks(before);
  assert.deepEqual(Object.keys(after.hooks).sort(), [...HOOK_EVENTS].sort());
  assert.deepEqual(commands(after, "Stop").slice(0, 1), ["eslint --fix"]);
  assert.match(commands(after, "Stop")[1], /\bcs share-sync --push-only\b/);
  assert.match(commands(after, "SessionStart")[0], /\bcs share-sync --pull-only\b.*\bcs note --print\b/);
  assert.equal(after.theme, "dark");
  assert.deepEqual(before, { theme: "dark", hooks: { Stop: [LINT] } }, "the input is not mutated");
  assert.deepEqual(withCsHooks(after), after, "installing again changes nothing");
  const first = withCsHooks({ hooks: { Stop: [LINT] }, theme: "dark" });
  assert.deepEqual(Object.keys(first), ["hooks", "theme"], "hooks stays where it was");
  assert.equal(JSON.stringify(withCsHooks(first)), JSON.stringify(first), "so installing again is byte-for-byte the same document");
});

test("hooks: re-install replaces an old-style `cs sync …` command with the current one", () => {
  const old = { hooks: { Stop: [cmd("command -v cs >/dev/null 2>&1 && cs sync --push-only --quiet || true")] } };
  const after: any = withCsHooks(old);
  assert.equal(commands(after, "Stop").length, 1);
  assert.match(commands(after, "Stop")[0], /\bcs share-sync --push-only\b/);
});

test("hooks: re-install drops the retired SessionEnd hook", () => {
  const old = { hooks: { SessionEnd: [cmd("command -v cs >/dev/null 2>&1 && cs handoff --mark --quiet || true")] } };
  const after: any = withCsHooks(old);
  assert.equal(after.hooks.SessionEnd, undefined);
  assert.deepEqual(Object.keys(after.hooks).sort(), [...HOOK_EVENTS].sort());
});

test("hooks: remove leaves other hooks alone and drops the hooks key when nothing is left", () => {
  const mixed = withCsHooks({ hooks: { Stop: [LINT], SessionEnd: [cmd("cs handoff --mark")] } });
  assert.deepEqual(withCsHooks(mixed, { remove: true }), { hooks: { Stop: [LINT] } });
  assert.deepEqual(withCsHooks(withCsHooks({}), { remove: true }), {});
  assert.deepEqual(withCsHooks({}, { remove: true }), {});
});
