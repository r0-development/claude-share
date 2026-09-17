/** .env files, the I/O half (src/envfiles.ts) over the in-memory secrets store: observe → apply → snapshot cycles against a
 *  real project directory in a temp HOME, asserting on the files, the store and what the next observe reports — never on
 *  which helper ran. The store contract itself is checked first, through the same adapter. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { memoryStore } from "../src/secrets/memory.ts";
import { applyEnv, newestSide, observeEnv, snapshotInSync, toFill, type EnvState } from "../src/envfiles.ts";
import type { Project } from "../src/manifest.ts";

let tmp: string; let n = 0;
before(() => {
  tmp = mkdtempSync(join(tmpdir(), "cs-envfiles-"));
  process.env.HOME = tmp; process.env.XDG_STATE_HOME = join(tmp, "state"); process.env.CS_CONFIG_DIR = join(tmp, "cs"); process.env.CLAUDE_CONFIG_DIR = join(tmp, "claude");
  process.env.GIT_CONFIG_GLOBAL = join(tmp, "gitconfig"); writeFileSync(process.env.GIT_CONFIG_GLOBAL, "[user]\n\tname = Tester\n\temail = tester@example.invalid\n[init]\n\tdefaultBranch = main\n");
});
after(() => rmSync(tmp, { recursive: true, force: true }));

// ---------------------------------------------------------------- the store contract, through the in-memory adapter
test("store: an entry is what was written, stamped; an entry written empty is gone; list names what is there", async () => {
  const s = memoryStore({}, { when: () => "2026-09-02T10:00:00Z", from: "laptop" });
  assert.equal(await s.load("web"), undefined);
  await s.write("web", { A: "1" }); await s.write("global", { T: "x" });
  assert.deepEqual(await s.load("web"), { values: { A: "1" }, when: "2026-09-02T10:00:00Z", from: "laptop" });
  assert.deepEqual((await s.list()).sort(), ["global", "web"]);
  await s.write("web", {});
  assert.equal(await s.load("web"), undefined);
  assert.deepEqual(await s.list(), ["global"]);
  assert.equal(s.ready(), true);
});

// ---------------------------------------------------------------- fixture: a project checkout where .env* is gitignored and .env.example tracked
const sh = (args: string[], cwd: string) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const PROJECT: Project = { name: "one", profiles: ["all"] } as Project;
function checkout(example?: string): string {
  const root = join(tmp, `one${++n}`); mkdirSync(root); sh(["init", "-q"], root);
  writeFileSync(join(root, ".gitignore"), ".env*\n!.env.example\n"); if (example !== undefined) writeFileSync(join(root, ".env.example"), example);
  sh(["add", "-A"], root); sh(["commit", "-q", "-m", "init"], root);
  return root;
}
const read = (f: string) => (existsSync(f) ? readFileSync(f, "utf8") : undefined);
const snapshot = (file: string) => read(join(tmp, "state", "cs", "env", "one", file));
/** The state of one file as observe reports it, with the merge flattened to what a table reads. */
const observe = async (store: ReturnType<typeof memoryStore>, root: string, p = PROJECT) => (await observeEnv(store, p, root, new Set(["one", "two"]))).map((st) => ({ file: st.file, kind: st.kind, stored: st.stored, from: st.storedFrom, toLocal: st.merge.toLocal.sort(), toStore: st.merge.toStore.sort(), conflicts: st.merge.conflicts.map((c) => c.key) }));
const one = async (store: ReturnType<typeof memoryStore>, root: string, file = ".env") => (await observeEnv(store, PROJECT, root, new Set(["one"]))).find((st) => st.file === file)!;

// ---------------------------------------------------------------- observe → apply → snapshot
test("first sync unites the keys of both sides, then the snapshot makes the next change one-sided", async () => {
  const store = memoryStore({ one: { values: { B: "2", C: "3" }, when: "2026-09-02T10:00:00Z", from: "laptop" } }, { when: () => "2026-09-03T10:00:00Z", from: "desk" });
  const root = checkout(); writeFileSync(join(root, ".env"), "# db\nA=1\nB=2\n");
  assert.deepEqual(await observe(store, root), [{ file: ".env", kind: "values", stored: { B: "2", C: "3" }, from: "laptop", toLocal: ["C"], toStore: ["A"], conflicts: [] }]);
  const r = await applyEnv(store, await one(store, root));
  assert.deepEqual(r, { stored: 1, local: 1, toFill: [] });
  assert.equal(read(join(root, ".env")), "# db\nA=1\nB=2\nC=3\n");                                   // patched in place: the comment stays
  assert.deepEqual(store.entries.one, { values: { A: "1", B: "2", C: "3" }, when: "2026-09-03T10:00:00Z", from: "desk" });
  assert.equal(snapshot(".env"), "A=1\nB=2\nC=3\n");
  assert.equal(snapshot(".env.prev"), "# db\nA=1\nB=2\n");                                             // the text before the patch
  assert.deepEqual(await observe(store, root), [{ file: ".env", kind: "values", stored: { A: "1", B: "2", C: "3" }, from: "desk", toLocal: [], toStore: [], conflicts: [] }]);
  // with the snapshot: a key removed here is a removal, not "the share has it, take it again"; a key changed there is taken
  writeFileSync(join(root, ".env"), "# db\nA=1\nB=2\n"); store.entries.one.values.B = "changed there";
  assert.deepEqual((await observe(store, root))[0], { file: ".env", kind: "values", stored: { A: "1", B: "changed there", C: "3" }, from: "desk", toLocal: ["B"], toStore: ["C"], conflicts: [] });
  await applyEnv(store, await one(store, root));
  assert.equal(read(join(root, ".env")), "# db\nA=1\nB=\"changed there\"\n"); assert.deepEqual(store.entries.one.values, { A: "1", B: "changed there" });
});
test("a side with no file is merged without the snapshot: the other side's keys come back, never a delete", async () => {
  const store = memoryStore({}, { when: () => "2026-09-03T10:00:00Z", from: "desk" });
  const root = checkout(); writeFileSync(join(root, ".env"), "A=1\nB=2\n");
  await applyEnv(store, await one(store, root));
  rmSync(join(root, ".env"));                                                                              // the local file is lost (or this is a fresh checkout)
  assert.deepEqual((await observe(store, root))[0], { file: ".env", kind: "values", stored: { A: "1", B: "2" }, from: "desk", toLocal: ["A", "B"], toStore: [], conflicts: [] });
  const r = await applyEnv(store, await one(store, root));
  assert.deepEqual(r, { stored: 0, local: 2, toFill: [] });
  assert.equal(read(join(root, ".env")), "A=1\nB=2\n"); assert.ok(store.entries.one);
  // and the other way: the entry dropped from the share → stored again from here
  delete store.entries.one;
  assert.deepEqual((await observe(store, root))[0], { file: ".env", kind: "values", stored: undefined, from: undefined, toLocal: [], toStore: ["A", "B"], conflicts: [] });
  await applyEnv(store, await one(store, root)); assert.deepEqual(store.entries.one.values, { A: "1", B: "2" });
});
test("the same key changed on both sides since the snapshot is a conflict: undecided it cannot be applied, the newer side is the fallback", async () => {
  const store = memoryStore({}, { when: () => "2026-09-03T10:00:00Z", from: "desk" });
  const root = checkout(); writeFileSync(join(root, ".env"), "K=v0\n");
  await applyEnv(store, await one(store, root));
  writeFileSync(join(root, ".env"), "K=here\n"); store.entries.one = { values: { K: "there" }, when: "2099-01-01T00:00:00Z", from: "laptop" };
  const st = await one(store, root);
  assert.deepEqual([st.merge.conflicts, st.merge.toLocal, st.merge.toStore], [[{ key: "K", local: "here", stored: "there" }], [], []]);
  assert.equal(newestSide(st), "stored");                                                                   // the share's commit is later than the file's mtime
  await assert.rejects(applyEnv(store, st), /undecided keys K/);
  assert.deepEqual(await applyEnv(store, st, { K: "local" }), { stored: 1, local: 0, toFill: [] });
  assert.deepEqual([read(join(root, ".env")), store.entries.one.values], ["K=here\n", { K: "here" }]);
  assert.deepEqual((await observe(store, root))[0].conflicts, []);
});
test("every key removed on both sides: the entry and the file go; a file the same on both sides gets its snapshot refreshed", async () => {
  const store = memoryStore({}, { when: () => "2026-09-03T10:00:00Z", from: "desk" });
  const root = checkout(); writeFileSync(join(root, ".env"), "A=1\n");
  await applyEnv(store, await one(store, root));
  // both machines wrote the same change independently: nothing moves, but the snapshot must learn it or the next change looks two-sided
  writeFileSync(join(root, ".env"), "A=1\nB=2\n"); store.entries.one.values.B = "2";
  const same = await one(store, root); assert.deepEqual([same.merge.toLocal, same.merge.toStore], [[], []]);
  snapshotInSync(same); assert.equal(snapshot(".env"), "A=1\nB=2\n");
  writeFileSync(join(root, ".env"), "A=1\n"); store.entries.one.values = { B: "2" };                      // B removed here, A removed there
  const st = await one(store, root);
  assert.deepEqual([st.merge.toLocal, st.merge.toStore, st.merge.result], [["A"], ["B"], {}]);
  await applyEnv(store, st);
  assert.equal(existsSync(join(root, ".env")), false); assert.equal(store.entries.one, undefined); assert.equal(snapshot(".env"), undefined);
  assert.equal(snapshot(".env.prev"), "A=1\n");
});
test("tracked and unignored files are observed but never merged; a .env.production is its own entry", async () => {
  const store = memoryStore({ "one.production": { values: { P: "1" }, when: "2026-09-02T10:00:00Z", from: "laptop" }, two: { values: { X: "1" }, when: "2026-09-02T10:00:00Z" }, "one.staging": { values: { S: "1" }, when: "2026-09-02T10:00:00Z" } });
  const root = checkout("DB=example\n"); writeFileSync(join(root, ".env"), "A=1\n"); writeFileSync(join(root, ".env.staging"), "S=1\n");
  sh(["add", "-f", ".env.staging"], root); sh(["commit", "-q", "-m", "staging tracked"], root);
  assert.deepEqual(await observe(store, root), [
    { file: ".env", kind: "values", stored: undefined, from: undefined, toLocal: [], toStore: ["A"], conflicts: [] },
    { file: ".env.example", kind: "tracked", stored: undefined, from: undefined, toLocal: [], toStore: [], conflicts: [] },
    { file: ".env.production", kind: "values", stored: { P: "1" }, from: "laptop", toLocal: ["P"], toStore: [], conflicts: [] },
    { file: ".env.staging", kind: "tracked", stored: undefined, from: undefined, toLocal: [], toStore: [], conflicts: [] },   // git has it: the entry is not read
  ]);
  writeFileSync(join(root, ".gitignore"), ".env*\n!.env.example\n!.env.unignored\n"); writeFileSync(join(root, ".env.unignored"), "U=1\n");
  assert.deepEqual((await observe(store, root)).find((s) => s.file === ".env.unignored"), { file: ".env.unignored", kind: "unignored", stored: undefined, from: undefined, toLocal: [], toStore: [], conflicts: [] });
});

// ---------------------------------------------------------------- keys-only files (.env.local): the set of keys travels, values never do
test(".env.local round trip: a key new here arrives with the .env.example value or empty, an existing value is never touched, nothing is asked", async () => {
  const desk = memoryStore({}, { when: () => "2026-09-03T10:00:00Z", from: "desk" });
  const root = checkout("PORT=3000\n"); writeFileSync(join(root, ".env.local"), "HOST=10.0.0.7\n");
  desk.entries["one.local"] = { values: { KEY: "", PORT: "" }, when: "2026-09-02T10:00:00Z", from: "desk" };          // stored by the other machine: keys, blank
  const st = await one(desk, root, ".env.local");
  assert.deepEqual([st.kind, st.merge.toLocal.sort(), st.merge.toStore, st.merge.conflicts, toFill(st)], ["local", ["KEY", "PORT"], ["HOST"], [], ["KEY"]]);
  assert.deepEqual(await applyEnv(desk, st), { stored: 1, local: 2, toFill: ["KEY"] });
  assert.equal(read(join(root, ".env.local")), "HOST=10.0.0.7\nKEY=\nPORT=3000\n");
  assert.deepEqual(desk.entries["one.local"].values, { HOST: "", KEY: "", PORT: "" });                                     // a value never reaches the store
  assert.equal(snapshot(".env.local"), "HOST=\nKEY=\nPORT=\n");                                                           // nor the snapshot
  // filling the value in moves nothing; a key removed on the other machine leaves this file too, the text before kept
  writeFileSync(join(root, ".env.local"), "HOST=10.0.0.7\nKEY=1.2.3.4\nPORT=3000\n");
  const filled = await one(desk, root, ".env.local"); assert.deepEqual([filled.merge.toLocal, filled.merge.toStore, toFill(filled)], [[], [], []]);
  desk.entries["one.local"].values = { HOST: "", KEY: "" };
  const dropped = await one(desk, root, ".env.local"); assert.deepEqual([dropped.merge.toLocal, dropped.merge.toStore], [["PORT"], []]);
  await applyEnv(desk, dropped);
  assert.equal(read(join(root, ".env.local")), "HOST=10.0.0.7\nKEY=1.2.3.4\n"); assert.equal(snapshot(".env.local.prev"), "HOST=10.0.0.7\nKEY=1.2.3.4\nPORT=3000\n");
});
test("env.local = [...] in the manifest makes another file keys-only", async () => {
  const store = memoryStore({}, { when: () => "2026-09-03T10:00:00Z", from: "desk" });
  const root = checkout(); writeFileSync(join(root, ".env.site"), "IP=10.0.0.1\n");
  const st = (await observeEnv(store, { ...PROJECT, env: { local: [".env.site"] } } as Project, root, new Set(["one"])))[0];
  assert.equal(st.kind, "local"); await applyEnv(store, st);
  assert.deepEqual(store.entries["one.site"].values, { IP: "" });
});
