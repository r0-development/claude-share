/** Claude Code's record of a checkout, against a fake ~/.claude and ~/.claude.json in a temp HOME. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { key, keyedPaths, latestTranscript, localMcp, memoryDirs, recordDir } from "../src/claudecode.ts";
import type { Checkout } from "../src/checkout.ts";

let tmp: string;
before(() => { tmp = mkdtempSync(join(tmpdir(), "cs-claudecode-")); process.env.HOME = tmp; delete process.env.CLAUDE_CONFIG_DIR; });
after(() => rmSync(tmp, { recursive: true, force: true }));

const checkout = (container: string, root: string, units: string[]): Checkout =>
  ({ project: { name: "x" } as Checkout["project"], container, root, units: units.map((path) => ({ path, rel: ".", branch: "main", dirty: 0, unpushed: 0 })) });
const put = (f: string, s = "", mtime?: number) => { mkdirSync(join(f, ".."), { recursive: true }); writeFileSync(f, s); if (mtime) utimesSync(f, mtime, mtime); };

test("claudecode: the key is the path with every non-alphanumeric turned into a dash; the record lives under ~/.claude/projects", () => {
  assert.equal(key("/home/u/dev/one"), "-home-u-dev-one");
  assert.equal(key("/home/u/dev/my_proj.v2"), "-home-u-dev-my-proj-v2");
  assert.equal(recordDir("/home/u/dev/one"), join(tmp, ".claude", "projects", "-home-u-dev-one"));
});

test("claudecode: a checkout is keyed under its container, its root and every unit — once each, in that order", () => {
  const plain = checkout("/w/one", "/w/one", ["/w/one"]);
  assert.deepEqual(keyedPaths(plain), ["/w/one"]);
  const wt = checkout("/w/two", "/w/two/repo", ["/w/two/repo", "/w/two/wt-feat"]);
  assert.deepEqual(keyedPaths(wt), ["/w/two", "/w/two/repo", "/w/two/wt-feat"]);
});

test("claudecode: memoryDirs are the memory directories that exist under any keyed path", () => {
  const c = checkout("/w/two", "/w/two/repo", ["/w/two/repo", "/w/two/wt-feat"]);
  assert.deepEqual(memoryDirs(c), []);
  put(join(recordDir("/w/two/repo"), "memory", "MEMORY.md"), "- a fact");
  put(join(recordDir("/w/two/wt-feat"), "memory", "MEMORY.md"), "- another");
  put(join(recordDir("/w/two"), "s.jsonl"));   // a record without memory is not a memory dir
  assert.deepEqual(memoryDirs(c), [join(recordDir("/w/two/repo"), "memory"), join(recordDir("/w/two/wt-feat"), "memory")]);
});

test("claudecode: latestTranscript — the unit's own newest session first, else the checkout's newest over every keyed path; only .jsonl counts", () => {
  const c = checkout("/w/three", "/w/three/repo", ["/w/three/repo", "/w/three/wt-a"]);
  assert.equal(latestTranscript(c), undefined);
  put(join(recordDir("/w/three/repo"), "old.jsonl"), "", 1_700_000_000);
  put(join(recordDir("/w/three/repo"), "new.jsonl"), "", 1_700_000_100);
  put(join(recordDir("/w/three/repo"), "newest.txt"), "", 1_700_000_900);
  put(join(recordDir("/w/three"), "container.jsonl"), "", 1_700_000_200);
  const newest = latestTranscript(c);
  assert.equal(newest?.file, join(recordDir("/w/three"), "container.jsonl"));
  assert.equal(newest?.ended, new Date(1_700_000_200_000).toISOString());
  assert.equal(latestTranscript(c, { path: "/w/three/repo" })?.file, join(recordDir("/w/three/repo"), "new.jsonl"));   // its own, though older than the container's
  assert.equal(latestTranscript(c, { path: "/w/three/wt-a" })?.file, join(recordDir("/w/three"), "container.jsonl"));   // none of its own: the checkout's newest
});

test("claudecode: localMcp — ~/.claude.json's local-scope servers over the keyed paths, the first path to name a server wins; no file or no JSON is nothing", () => {
  const c = checkout("/w/four", "/w/four/repo", ["/w/four/repo"]);
  assert.deepEqual(localMcp(c), {});
  writeFileSync(join(tmp, ".claude.json"), "not json");
  assert.deepEqual(localMcp(c), {});
  writeFileSync(join(tmp, ".claude.json"), JSON.stringify({ projects: {
    "/w/four": { mcpServers: { a: { type: "stdio", command: "a-from-container" } } },
    "/w/four/repo": { mcpServers: { a: { type: "stdio", command: "a-from-repo" }, b: { type: "http", url: "https://b.example" } } },
    "/elsewhere": { mcpServers: { c: {} } },
  } }));
  assert.deepEqual(localMcp(c), { a: { type: "stdio", command: "a-from-container" }, b: { type: "http", url: "https://b.example" } });
});
