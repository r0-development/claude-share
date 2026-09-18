/** Project state placement at its two seams: `decide` as a pure table over hand-typed observations, and the entry points
 *  over real directories (a share, checkouts, one with worktrees) in a temp HOME — asserting on the files afterwards and the
 *  lines a caller would print. Never on which helper ran. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { decide, forget, memoryDir, place, placeAll, projectState, stripped, sweep, type Observation } from "../src/projectstate.ts";
import { parseManifest, type Project } from "../src/manifest.ts";
import type { Share } from "../src/share.ts";

const SL = ".claude/settings.local.json";
const MEM = "~/share/projects/x/memory";
const pointer = (rest: Record<string, unknown> = {}) => JSON.stringify({ ...rest, autoMemoryDirectory: MEM }, null, 2) + "\n";

// ---------------------------------------------------------------- decide: the newer-wins table
/** A stamp as observe would build it: content with the pointer stripped, mtime in seconds; `raw` what a unit has on disk. */
const at = (s: string, mtime: number) => ({ data: Buffer.from(s), mtime });
const on = (s: string, mtime: number, raw = s) => ({ data: Buffer.from(s), raw: Buffer.from(raw), mtime });
const obs = (o: Partial<Observation>): Observation => ({ state: {}, targets: {}, remembered: [], pointer: MEM, excludes: [], ...o });
/** Decisions with buffers as strings, so a table reads. */
const text = (d: ReturnType<typeof decide>) => ({
  toState: d.toState.map((x) => [x.rel, x.data.toString(), x.mtime, x.from]),
  toTargets: d.toTargets.map((x) => [x.target, x.rel, x.data.toString(), x.mtime]),
  removals: d.removals.map((x) => [x.target, x.rel]), excludes: d.excludes.map((x) => [x.target, x.missing]), placed: d.placed,
});

test("decide: copy-back — the newest unit's copy goes to the project state and to every other unit, stamped with its mtime", () => {
  const d = text(decide(obs({ state: { "CLAUDE.md": at("v1\n", 10) }, targets: { "/a": { "CLAUDE.md": on("v2\n", 20), [SL]: on("", 5, pointer()) }, "/b": { "CLAUDE.md": on("v1\n", 10), [SL]: on("", 5, pointer()) } } })));
  assert.deepEqual(d.toState, [["CLAUDE.md", "v2\n", 20, "/a"]]);
  assert.deepEqual(d.toTargets, [["/b", "CLAUDE.md", "v2\n", 20]]);
  assert.deepEqual([d.removals, d.placed], [[], ["CLAUDE.md"]]);
});
test("decide: fan-out — the project state, when newest, goes to every unit that differs; an older copy in a unit never wins", () => {
  const d = text(decide(obs({ state: { "CLAUDE.md": at("v2\n", 30), ".claude/commands/x.md": at("cmd\n", 30) }, targets: { "/a": { "CLAUDE.md": on("v1\n", 20), [SL]: on("", 5, pointer()) }, "/b": { "CLAUDE.md": on("v2\n", 30), [SL]: on("", 5, pointer()) } } })));
  assert.deepEqual(d.toState, []);
  assert.deepEqual(d.toTargets, [["/a", ".claude/commands/x.md", "cmd\n", 30], ["/b", ".claude/commands/x.md", "cmd\n", 30], ["/a", "CLAUDE.md", "v2\n", 30]]);
  assert.deepEqual(d.placed, [".claude/commands/x.md", "CLAUDE.md"]);
});
test("decide: a tie on mtime keeps the project state's copy; a different content with the same mtime does not win", () => {
  const d = text(decide(obs({ state: { "CLAUDE.md": at("side\n", 10) }, targets: { "/a": { "CLAUDE.md": on("mine\n", 10), [SL]: on("", 5, pointer()) } } })));
  assert.deepEqual([d.toState, d.toTargets], [[], [["/a", "CLAUDE.md", "side\n", 10]]]);
});
test("decide: deletion — a file placed last time and now gone from the project state is removed from every unit, whatever it did to it, and forgotten", () => {
  const d = text(decide(obs({ state: {}, remembered: ["CLAUDE.md", ".claude/gone.md"], targets: { "/a": { "CLAUDE.md": on("edited later\n", 99), [SL]: on("", 5, pointer()) }, "/b": { [SL]: on("", 5, pointer()) } } })));
  assert.deepEqual(d.removals, [["/a", "CLAUDE.md"]]);
  assert.deepEqual([d.toState, d.toTargets, d.placed], [[], [], []]);
});
test("decide: a file new in a unit that was never placed is not a deletion — it is imported into the project state", () => {
  const d = text(decide(obs({ state: {}, targets: { "/a": { ".mcp.json": on("{}\n", 7), [SL]: on("", 5, pointer()) } } })));
  assert.deepEqual([d.toState, d.placed], [[[".mcp.json", "{}\n", 7, "/a"]], [".mcp.json"]]);
});
test("decide: settings.local.json — the pointer is this machine's: never compared, never stored, always present in the unit", () => {
  // nothing anywhere: every unit gets a pointer-only file, the project state gets nothing, nothing is remembered
  const fresh = text(decide(obs({ targets: { "/a": {} } })));
  assert.deepEqual([fresh.toState, fresh.toTargets, fresh.placed], [[], [["/a", SL, pointer(), -1]], []]);
  // a unit whose file is only the pointer, already right: nothing to do
  assert.deepEqual(text(decide(obs({ targets: { "/a": { [SL]: on("", 5, pointer()) } } }))).toTargets, []);
  // a stale pointer (the share moved) is rewritten even though the content compares equal
  assert.deepEqual(text(decide(obs({ targets: { "/a": { [SL]: on("", 5, JSON.stringify({ autoMemoryDirectory: "~/old" }) + "\n") } } }))).toTargets, [["/a", SL, pointer(), 5]]);
  // real settings edited in a unit travel to the project state without the pointer, and to the other unit with it
  const perms = JSON.stringify({ permissions: { allow: ["Bash(ls)"] } }, null, 2) + "\n";
  const d = text(decide(obs({ state: { [SL]: at("", 1) }, targets: { "/a": { [SL]: on(perms, 20, pointer({ permissions: { allow: ["Bash(ls)"] } })) }, "/b": { [SL]: on("", 5, pointer()) } } })));
  assert.deepEqual(d.toState, [[SL, perms, 20, "/a"]]);
  assert.deepEqual(d.toTargets, [["/b", SL, pointer({ permissions: { allow: ["Bash(ls)"] } }), 20]]);
  assert.deepEqual(d.placed, [SL]);
});
test("decide: a second machine with a fresh checkout receives everything with its own pointer, sends nothing back", () => {
  const d = text(decide(obs({ state: { "CLAUDE.md": at("v2\n", 30), [SL]: at(JSON.stringify({ model: "opus" }, null, 2) + "\n", 30) }, targets: { "/new": {} } })));
  assert.deepEqual(d.toState, []);
  assert.deepEqual(d.toTargets, [["/new", SL, pointer({ model: "opus" }), 30], ["/new", "CLAUDE.md", "v2\n", 30]]);
});
test("decide: exclude lines missing from a repo's info/exclude are added once per repo, after everything else", () => {
  const d = text(decide(obs({ targets: { "/a": { [SL]: on("", 5, pointer()) }, "/a-wt": { [SL]: on("", 5, pointer()) } }, excludes: [{ file: "/a/.git/info/exclude", target: "/a", text: "CLAUDE.md\n" }] })));
  assert.deepEqual(d.excludes, [["/a", [".claude/", ".mcp.json", "CLAUDE.local.md"]]]);
  assert.deepEqual(text(decide(obs({ excludes: [{ file: "/a/.git/info/exclude", target: "/a", text: ".claude/\n.mcp.json\nCLAUDE.md\nCLAUDE.local.md\n" }] }))).excludes, []);
});
test("stripped: the pointer alone goes with the file, the pointer among other keys leaves them, no pointer or no JSON is nothing to do", () => {
  assert.equal(stripped(undefined), undefined);
  assert.equal(stripped(Buffer.from("not json")), undefined);
  assert.equal(stripped(Buffer.from('{"model":"opus"}')), undefined);
  assert.equal(stripped(Buffer.from(pointer())), null);
  assert.equal(stripped(Buffer.from(pointer({ model: "opus" })))?.toString(), JSON.stringify({ model: "opus" }, null, 2) + "\n");
});

// ---------------------------------------------------------------- the entry points over real directories
let tmp: string, ws: string, share: Share;
const sh = (args: string[], cwd?: string) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const MANIFEST = `schema_version = 1\n[workspace]\nroot = "~/dev"\n[projects.one]\nprofiles = ["all"]\n[projects.wt]\nprofiles = ["all"]\nlayout = "worktrees"\n[projects.away]\nprofiles = ["all"]\n`;
before(() => {
  tmp = mkdtempSync(join(tmpdir(), "cs-projectstate-")); ws = join(tmp, "dev"); mkdirSync(ws);
  process.env.HOME = tmp; process.env.XDG_STATE_HOME = join(tmp, "state"); process.env.CS_CONFIG_DIR = join(tmp, "cs");
  process.env.GIT_CONFIG_GLOBAL = join(tmp, "gitconfig"); writeFileSync(process.env.GIT_CONFIG_GLOBAL, "[user]\n\tname = Tester\n\temail = tester@example.invalid\n[init]\n\tdefaultBranch = main\n");
  share = { path: join(tmp, "share"), machine: { name: "desk", profiles: ["all"], exclude: [], ignore: [], secretsBackend: "none" }, manifest: parseManifest(MANIFEST) };
  mkdirSync(share.path);
});
after(() => rmSync(tmp, { recursive: true, force: true }));
const P = (name: string) => share.manifest.projects[name] as Project;
const put = (dir: string, rel: string, s: string, mtime?: number) => { mkdirSync(join(dir, rel, ".."), { recursive: true }); writeFileSync(join(dir, rel), s); if (mtime) utimesSync(join(dir, rel), mtime, mtime); };
const read = (dir: string, rel: string) => (existsSync(join(dir, rel)) ? readFileSync(join(dir, rel), "utf8") : undefined);
const repo = (dir: string) => { mkdirSync(dir, { recursive: true }); sh(["init", "-q", dir]); return dir; };

test("place: a plain checkout — its Claude files go to the project state, the memory dir exists, the pointer names it, the exclude is written, git sees nothing", () => {
  const co = repo(join(ws, "one")); put(co, "CLAUDE.md", "# one\n", 1000);
  const lines = place(share, P("one"));
  assert.deepEqual(lines, [`~/dev/one/${SL} ← project state`, `project state ← CLAUDE.md (from ~/dev/one)`, `exclude .claude/, .mcp.json, CLAUDE.md, CLAUDE.local.md in ~/dev/one`]);
  assert.equal(read(projectState(share, "one"), "CLAUDE.md"), "# one\n");
  assert.ok(existsSync(memoryDir(share, "one")));
  assert.deepEqual(JSON.parse(read(co, SL)!), { autoMemoryDirectory: "~/share/projects/one/memory" });
  assert.equal(read(share.path, `projects/one/${SL}`), undefined);   // the pointer is not the share's
  assert.equal(sh(["status", "--porcelain"], co), "");
  assert.deepEqual(place(share, P("one")), []);   // settled
  assert.deepEqual(JSON.parse(read(join(tmp, "state", "cs", "project-state"), "one.json")!), { root: co, files: ["CLAUDE.md"] });
});
test("place: worktrees — the project state reaches the repo and every worktree; a worktree's edit flows back and across", () => {
  const root = repo(join(ws, "wt", "repo")); put(root, "README.md", "x\n"); sh(["add", "-A"], root); sh(["commit", "-q", "-m", "init"], root);
  sh(["worktree", "add", "-q", "-b", "feat", join(ws, "wt", "wt-feat")], root); const feat = join(ws, "wt", "wt-feat");
  put(projectState(share, "wt"), "CLAUDE.md", "# wt\n", 2000);
  const first = place(share, P("wt"));
  assert.deepEqual(first.filter((l) => l.startsWith("exclude")).length, 1);   // one info/exclude for the whole checkout
  assert.equal(read(root, "CLAUDE.md"), "# wt\n"); assert.equal(read(feat, "CLAUDE.md"), "# wt\n");
  assert.ok(read(feat, SL)!.includes("projects/wt/memory"));
  put(feat, "CLAUDE.md", "# wt v2\n", 3000);
  assert.deepEqual(place(share, P("wt")), ["project state ← CLAUDE.md (from ~/dev/wt/wt-feat)", "~/dev/wt/repo/CLAUDE.md ← project state"]);
  assert.equal(read(projectState(share, "wt"), "CLAUDE.md"), "# wt v2\n"); assert.equal(read(root, "CLAUDE.md"), "# wt v2\n");
  assert.equal(sh(["status", "--porcelain"], feat), "");
});
test("place: a file deleted from the project state leaves every checkout on the next run; check mode only reports", () => {
  const co = join(ws, "one"); put(projectState(share, "one"), ".claude/commands/x.md", "cmd\n", 4000);
  place(share, P("one")); assert.equal(read(co, ".claude/commands/x.md"), "cmd\n");
  rmSync(join(projectState(share, "one"), ".claude"), { recursive: true });
  assert.deepEqual(place(share, P("one"), { check: true }), ["remove .claude/commands/x.md from ~/dev/one (deleted in project state)"]);
  assert.equal(read(co, ".claude/commands/x.md"), "cmd\n");
  assert.deepEqual(place(share, P("one")), ["remove .claude/commands/x.md from ~/dev/one (deleted in project state)"]);
  assert.equal(read(co, ".claude/commands/x.md"), undefined);
  assert.deepEqual(place(share, P("one")), []);
});
test("place: a project-state file outside the managed set (.claude/settings.json) is placed once and then settles; an edit to it in a unit flows back", () => {
  const co = join(ws, "one"); put(projectState(share, "one"), ".claude/settings.json", '{"model":"opus"}\n', 4100);
  assert.deepEqual(place(share, P("one")), ["~/dev/one/.claude/settings.json ← project state"]);
  assert.deepEqual(place(share, P("one")), []);
  put(co, ".claude/settings.json", '{"model":"sonnet"}\n', 4200);
  assert.deepEqual(place(share, P("one")), ["project state ← .claude/settings.json (from ~/dev/one)"]);
  assert.equal(read(projectState(share, "one"), ".claude/settings.json"), '{"model":"sonnet"}\n');
  rmSync(join(projectState(share, "one"), ".claude", "settings.json"));   // gone from the project state: a file outside the managed set is left alone (it may be the project's own)
  assert.deepEqual(place(share, P("one")), []); assert.equal(read(co, ".claude/settings.json"), '{"model":"sonnet"}\n');
});
test("place: no checkout here is nothing to do, no record either", () => {
  assert.deepEqual(place(share, P("away")), []);
  assert.ok(!existsSync(join(tmp, "state", "cs", "project-state", "away.json")));
});
test("placeAll: every selected project with a checkout, lines named by project; named projects only those; an unknown name throws", () => {
  put(projectState(share, "one"), "CLAUDE.md", "# one v2\n", 5000);
  put(projectState(share, "wt"), ".mcp.json", "{}\n", 5000);
  const lines = placeAll(share);
  assert.deepEqual(lines, ["one: ~/dev/one/CLAUDE.md ← project state", "wt: ~/dev/wt/repo/.mcp.json ← project state", "wt: ~/dev/wt/wt-feat/.mcp.json ← project state"]);
  put(projectState(share, "one"), "CLAUDE.md", "# one v3\n", 6000);
  assert.deepEqual(placeAll(share, { names: ["wt"] }), []);
  assert.deepEqual(placeAll(share, { names: ["one"], check: true }), ["one: ~/dev/one/CLAUDE.md ← project state"]);
  assert.throws(() => placeAll(share, { names: ["nope"] }), /unknown project\(s\): nope/);
  assert.deepEqual(placeAll(share), ["one: ~/dev/one/CLAUDE.md ← project state"]);
});
test("sweep: a record whose project left the manifest strips the pointer where the record says the checkout is and drops the record; own settings stay", () => {
  const co = join(ws, "one"); put(co, SL, JSON.stringify({ autoMemoryDirectory: "~/share/projects/one/memory", permissions: { allow: ["Bash(ls)"] } }));
  const gone = { ...share, manifest: parseManifest(MANIFEST.replace(/\[projects\.one\]\nprofiles = \["all"\]\n/, "")) };
  assert.deepEqual(sweep(gone, { check: true }), ["one: auto-memory pointer removed from ~/dev/one (project removed from the share)"]);
  assert.ok(read(co, SL)!.includes("autoMemoryDirectory"));
  assert.deepEqual(placeAll(gone), ["one: auto-memory pointer removed from ~/dev/one (project removed from the share)"]);   // a full placement sweeps first
  assert.deepEqual(JSON.parse(read(co, SL)!), { permissions: { allow: ["Bash(ls)"] } });
  assert.ok(!existsSync(join(tmp, "state", "cs", "project-state", "one.json")));
  assert.deepEqual(sweep(gone), []);
});
test("forget: cs remove's tidy-up — the pointer goes from the given units (the file too when nothing else is in it), the record goes", () => {
  const root = join(ws, "wt", "repo"), feat = join(ws, "wt", "wt-feat");
  assert.deepEqual(forget("wt", [root, feat]), ["wt: auto-memory pointer removed from ~/dev/wt/repo", "wt: auto-memory pointer removed from ~/dev/wt/wt-feat"]);
  assert.equal(read(root, SL), undefined); assert.equal(read(feat, SL), undefined);
  assert.ok(!existsSync(join(tmp, "state", "cs", "project-state", "wt.json")));
  assert.deepEqual(forget("wt", [root, feat]), []);
});
