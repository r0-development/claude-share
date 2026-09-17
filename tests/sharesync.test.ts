/** The share cycle at its seam: a bare share and two clones of it — two machines — in a temp HOME; never a fake git.
 *  Every test asserts what a machine can observe afterwards: the files in its share, what reached the bare remote, the
 *  backup refs, and that the share is never left mid-rebase or locked. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { syncShare, type Conflict, type Side } from "../src/sharesync.ts";
import { open, type Share } from "../src/share.ts";
import type { Machine } from "../src/machine.ts";
import * as ui from "../src/ui.ts";

// ---------------------------------------------------------------- fixture: a bare share, cloned by desk and by laptop
let tmp: string; let n = 0;
const sh = (args: string[], cwd?: string, env: Record<string, string> = {}) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env } }).trim();
const MANIFEST = `schema_version = 1\n\n[workspace]\nroot = "~/dev"\n\n# ---- Projects\n\n[projects.a]\nprofiles = ["all"]\n`;
const ATTRS = "projects/*/memory/*.md merge=union\nplans/*.md merge=union\n";
const SETTINGS = "claude/settings.base.json";
before(() => {
  tmp = mkdtempSync(join(tmpdir(), "cs-sharesync-"));
  process.env.HOME = tmp; process.env.XDG_STATE_HOME = join(tmp, "state"); process.env.CS_CONFIG_DIR = join(tmp, "cs"); process.env.CLAUDE_CONFIG_DIR = join(tmp, "claude");
  process.env.GIT_CONFIG_GLOBAL = join(tmp, "gitconfig"); writeFileSync(process.env.GIT_CONFIG_GLOBAL, "[user]\n\tname = Tester\n\temail = tester@example.invalid\n[init]\n\tdefaultBranch = main\n");
  mkdirSync(join(tmp, "dev")); mkdirSync(join(tmp, "laptop-dev"));
  ui.setQuiet(true);
});
after(() => rmSync(tmp, { recursive: true, force: true }));

interface Pair { bare: string; desk: Share; laptop: Share }
/** A fresh bare share seeded with the manifest, the union attributes and one settings file; desk and laptop clone it.
 *  The laptop's workspace is elsewhere so only the desk has project checkouts under ~/dev. */
function pair(): Pair {
  const root = join(tmp, `p${++n}`); mkdirSync(root);
  const bare = join(root, "share.git"); sh(["init", "-q", "--bare", "-b", "main", bare]);
  const seed = join(root, "seed"); sh(["clone", "-q", bare, seed]);
  writeFileSync(join(seed, "projects.toml"), MANIFEST); writeFileSync(join(seed, ".gitattributes"), ATTRS);
  mkdirSync(join(seed, "claude")); writeFileSync(join(seed, SETTINGS), '{"model":"opus"}\n');
  sh(["add", "-A"], seed); sh(["commit", "-q", "-m", "skeleton"], seed, { GIT_COMMITTER_DATE: "2026-09-01T00:00:00Z", GIT_AUTHOR_DATE: "2026-09-01T00:00:00Z" }); sh(["push", "-q", "origin", "main"], seed);
  const clone = (name: string, machine: Machine) => { const dir = join(root, name); sh(["clone", "-q", bare, dir]); return open(machine, dir); };
  return { bare, desk: clone("desk", { name: "desk", profiles: ["all"], exclude: [], secretsBackend: "none" }), laptop: clone("laptop", { name: "laptop", profiles: ["all"], exclude: [], secretsBackend: "none", workspace: join(tmp, "laptop-dev") }) };
}
/** Write `rel` in a share and commit it there at `when` (ISO), as a machine's own sync would have. */
function commitAt(s: Share, rel: string, content: string | null, when: string, msg = rel) {
  if (content === null) unlinkSync(join(s.path, rel)); else { mkdirSync(join(s.path, rel, ".."), { recursive: true }); writeFileSync(join(s.path, rel), content); }
  sh(["add", "-A"], s.path); sh(["commit", "-q", "-m", msg], s.path, { GIT_COMMITTER_DATE: when, GIT_AUTHOR_DATE: when });
}
const read = (s: Share, rel: string) => (existsSync(join(s.path, rel)) ? readFileSync(join(s.path, rel), "utf8") : undefined);
const head = (repo: string) => sh(["rev-parse", "HEAD"], repo);
/** What every run must leave behind: no rebase in progress, the lock released. */
function clean(s: Share) {
  assert.ok(!existsSync(join(s.path, ".git", "rebase-merge")) && !existsSync(join(s.path, ".git", "rebase-apply")), "left mid-rebase");
  assert.ok(!existsSync(join(tmp, "state", "cs", "sync.lock")), "lock left behind");
}
const rebasing = (s: Share) => existsSync(join(s.path, ".git", "rebase-merge")) || existsSync(join(s.path, ".git", "rebase-apply"));
/** An `ask` that answers `side` for every file and records what it was asked — and whether `s` was mid-rebase at the time. */
const answering = (side: Side, s?: Share) => { const asked: Conflict[] = []; let midRebase = false; const ask = async (c: Conflict) => { asked.push(c); if (s && rebasing(s)) midRebase = true; return side; }; return { ask, asked, get midRebase() { return midRebase; } }; };

// ---------------------------------------------------------------- the plain cycle
test("syncShare: local changes are committed as this machine and pushed; the other machine fast-forwards to them", async () => {
  const { bare, desk, laptop } = pair();
  writeFileSync(join(desk.path, SETTINGS), '{"model":"sonnet"}\n');
  const r = await syncShare(desk, {});
  assert.deepEqual([r.ok, r.offline, r.pushed], [true, undefined, 1]);
  assert.equal(head(bare), head(desk.path));
  assert.match(sh(["log", "-1", "--format=%s%n%b"], desk.path), /^sync\(desk\): 1 file\(s\) .*\nCs-Machine: desk$/);
  const l = await syncShare(laptop, {});
  assert.deepEqual([l.ok, l.pushed], [true, 0]);
  assert.equal(read(laptop, SETTINGS), '{"model":"sonnet"}\n');
  clean(desk); clean(laptop);
});

// ---------------------------------------------------------------- a file changed on both machines: the conflict table
/** Desk's version of the settings file is on the remote at `deskAt`; laptop's own commit at `laptopAt` has not left yet. */
function diverged(p: Pair, deskAt = "2026-09-10T10:00:00Z", laptopAt = "2026-09-10T10:00:00Z", deskContent: string | null = '{"model":"sonnet"}\n') {
  commitAt(p.desk, SETTINGS, deskContent, deskAt); sh(["push", "-q", "origin", "main"], p.desk.path);
  commitAt(p.laptop, SETTINGS, '{"model":"haiku"}\n', laptopAt);
}
test("asked: `ask` decides per file with the rebase aborted; theirs takes the other machine's version, ours keeps this one's, both end pushed", async () => {
  const theirs = pair(); diverged(theirs); const t = answering("theirs", theirs.laptop);
  const r = await syncShare(theirs.laptop, { ask: t.ask });
  assert.deepEqual([r.ok, r.pushed], [true, 0]);   // the laptop's commit became empty and was skipped: nothing left to push
  assert.deepEqual(t.asked.map((c) => [c.file, c.ours.deleted, c.theirs.deleted]), [[SETTINGS, false, false]]);
  assert.equal(t.midRebase, false);   // asked with the share as it was
  assert.equal(read(theirs.laptop, SETTINGS), '{"model":"sonnet"}\n');
  assert.equal(head(theirs.bare), head(theirs.laptop.path));
  clean(theirs.laptop);

  const ours = pair(); diverged(ours); const o = answering("ours");
  assert.equal((await syncShare(ours.laptop, { ask: o.ask })).ok, true);
  assert.equal(read(ours.laptop, SETTINGS), '{"model":"haiku"}\n');
  assert.equal(head(ours.bare), head(ours.laptop.path));
  assert.equal((await syncShare(ours.desk, {})).ok, true);   // the desk fast-forwards to what the laptop decided
  assert.equal(read(ours.desk, SETTINGS), '{"model":"haiku"}\n');
  clean(ours.laptop); clean(ours.desk);
});
test("newest: without `ask` the newer change wins per file, whichever machine made it; a tie stays with this machine", async () => {
  const deskNewer = pair(); diverged(deskNewer, "2026-09-10T12:00:00Z", "2026-09-10T11:00:00Z");
  assert.equal((await syncShare(deskNewer.laptop, {})).ok, true);
  assert.equal(read(deskNewer.laptop, SETTINGS), '{"model":"sonnet"}\n');
  const laptopNewer = pair(); diverged(laptopNewer, "2026-09-10T11:00:00Z", "2026-09-10T12:00:00Z");
  assert.deepEqual([(await syncShare(laptopNewer.laptop, {})).pushed, read(laptopNewer.laptop, SETTINGS), head(laptopNewer.bare) === head(laptopNewer.laptop.path)], [1, '{"model":"haiku"}\n', true]);
  const tie = pair(); diverged(tie, "2026-09-10T12:00:00Z", "2026-09-10T12:00:00Z");
  assert.deepEqual([(await syncShare(tie.laptop, {})).ok, read(tie.laptop, SETTINGS)], [true, '{"model":"haiku"}\n']);
  for (const p of [deskNewer, laptopNewer, tie]) clean(p.laptop);
});
test("deleted on one side: a deletion is a change like any other — newest wins, and `ask` is told which side deleted", async () => {
  const p = pair(); diverged(p, "2026-09-10T12:00:00Z", "2026-09-10T11:00:00Z", null);   // the desk deleted it, later than the laptop edited it
  assert.equal((await syncShare(p.laptop, {})).ok, true);
  assert.equal(read(p.laptop, SETTINGS), undefined);
  const q = pair(); diverged(q, "2026-09-10T12:00:00Z", "2026-09-10T11:00:00Z", null); const a = answering("ours");
  assert.equal((await syncShare(q.laptop, { ask: a.ask })).ok, true);
  assert.deepEqual(a.asked.map((c) => [c.ours.deleted, c.theirs.deleted]), [[false, true]]);
  assert.deepEqual([read(q.laptop, SETTINGS), sh(["ls-tree", "--name-only", "HEAD", SETTINGS], q.bare)], ['{"model":"haiku"}\n', SETTINGS]);
  clean(p.laptop); clean(q.laptop);
});
test("resolve: `--resolve ours|theirs` settles every file that way without asking; `newest` says so explicitly even with an `ask`", async () => {
  const p = pair(); diverged(p, "2026-09-10T12:00:00Z", "2026-09-10T11:00:00Z"); const a = answering("theirs");
  assert.equal((await syncShare(p.laptop, { resolve: "ours", ask: a.ask })).ok, true);
  assert.deepEqual([a.asked.length, read(p.laptop, SETTINGS)], [0, '{"model":"haiku"}\n']);
  const q = pair(); diverged(q, "2026-09-10T12:00:00Z", "2026-09-10T11:00:00Z"); const b = answering("ours");
  assert.equal((await syncShare(q.laptop, { resolve: "newest", ask: b.ask })).ok, true);
  assert.deepEqual([b.asked.length, read(q.laptop, SETTINGS)], [0, '{"model":"sonnet"}\n']);
  clean(p.laptop); clean(q.laptop);
});
test("two stops: two local commits touch the file — asked once, settled at both stops, this machine's commits kept in a backup ref", async () => {
  const p = pair(); diverged(p);
  commitAt(p.laptop, SETTINGS, '{"model":"haiku","x":1}\n', "2026-09-10T10:05:00Z"); const before = head(p.laptop.path);
  const a = answering("theirs");
  const r = await syncShare(p.laptop, { ask: a.ask });
  assert.deepEqual([r.ok, a.asked.length, read(p.laptop, SETTINGS)], [true, 1, '{"model":"sonnet"}\n']);
  const backups = sh(["for-each-ref", "--format=%(refname)", "refs/cs/backup/share"], p.laptop.path).split("\n").filter(Boolean);
  assert.equal(backups.length, 1);
  assert.equal(sh(["rev-parse", backups[0]], p.laptop.path), before);   // the losing commits, as they were
  assert.equal(sh(["show", `${backups[0]}:${SETTINGS}`], p.laptop.path), '{"model":"haiku","x":1}');
  clean(p.laptop);
});
test("union: memory and plan files changed on both machines merge line-wise — no question, nothing to settle", async () => {
  const p = pair(); const mem = "projects/a/memory/MEMORY.md";
  commitAt(p.desk, mem, "# a\n", "2026-09-09T00:00:00Z"); sh(["push", "-q", "origin", "main"], p.desk.path); sh(["pull", "-q"], p.laptop.path);
  commitAt(p.desk, mem, "# a\n- desk fact\n", "2026-09-10T00:00:00Z"); sh(["push", "-q", "origin", "main"], p.desk.path);
  commitAt(p.laptop, mem, "# a\n- laptop fact\n", "2026-09-10T00:00:00Z"); const a = answering("ours");
  assert.equal((await syncShare(p.laptop, { ask: a.ask })).ok, true);
  assert.deepEqual([a.asked.length, read(p.laptop, mem)], [0, "# a\n- desk fact\n- laptop fact\n"]);
  clean(p.laptop);
});
/** A prepare-commit-msg hook in a share clone: what `git rebase --continue` runs before it commits a settled step (pre-commit it skips). */
function hook(s: Share, script: string) { const f = join(s.path, ".git", "hooks", "prepare-commit-msg"); writeFileSync(f, `#!/bin/sh\n${script}\n`, { mode: 0o755 }); }
test("rebase stops without a conflict: git refused the settled step for a reason that is not ours — the rebase is aborted and the share is as it was", async () => {
  const p = pair(); diverged(p, "2026-09-10T11:00:00Z", "2026-09-10T12:00:00Z"); const before = head(p.laptop.path);   // this machine's newer: the step is a real commit
  hook(p.laptop, "exit 1");
  const r = await syncShare(p.laptop, {});
  assert.deepEqual([r.ok, head(p.laptop.path), read(p.laptop, SETTINGS)], [false, before, '{"model":"haiku"}\n']);
  clean(p.laptop);
});
test("same step twice: a stop that comes back after being settled is reported as stuck instead of looping — aborted, the share as it was", async () => {
  const p = pair(); diverged(p, "2026-09-10T11:00:00Z", "2026-09-10T12:00:00Z"); const before = head(p.laptop.path);
  hook(p.laptop, `git checkout -m -- ${SETTINGS}; exit 1`);   // the hook re-creates the conflict it was asked to commit past
  const r = await syncShare(p.laptop, {});
  assert.deepEqual([r.ok, head(p.laptop.path), read(p.laptop, SETTINGS)], [false, before, '{"model":"haiku"}\n']);
  clean(p.laptop);
});

// ---------------------------------------------------------------- the rest of the cycle: offline, halves, debounce, copy-back before the commit, apply and link after the pull
test("offline: a fetch that fails keeps the commit for later and says so; `commitOnly` does not even try", async () => {
  const p = pair(); sh(["remote", "set-url", "origin", join(tmp, "nowhere.git")], p.laptop.path);
  writeFileSync(join(p.laptop.path, SETTINGS), '{"model":"haiku"}\n');
  const r = await syncShare(p.laptop, {});
  assert.deepEqual([r.ok, r.offline, sh(["status", "--porcelain"], p.laptop.path), readFileSync(join(tmp, "state", "cs", "last-sync"), "utf8")], [true, true, "", "offline\n"]);
  writeFileSync(join(p.laptop.path, SETTINGS), '{"model":"haiku","x":1}\n');
  const c = await syncShare(p.laptop, { commitOnly: true });
  assert.deepEqual([c.ok, c.offline, sh(["rev-list", "--count", "origin/main..HEAD"], p.laptop.path)], [true, true, "2"]);
  clean(p.laptop);
});
test("halves: `pullOnly` brings the remote in, commits and pushes nothing; `pushOnly` commits and sends", async () => {
  const p = pair(); commitAt(p.desk, SETTINGS, '{"model":"sonnet"}\n', "2026-09-10T10:00:00Z"); sh(["push", "-q", "origin", "main"], p.desk.path);
  mkdirSync(join(p.laptop.path, "plans")); writeFileSync(join(p.laptop.path, "plans", "x.md"), "# plan\n");
  const pull = await syncShare(p.laptop, { pullOnly: true });
  assert.deepEqual([pull.ok, pull.pushed, read(p.laptop, SETTINGS), sh(["status", "--porcelain"], p.laptop.path)], [true, 0, '{"model":"sonnet"}\n', "?? plans/"]);   // nothing committed, nothing pushed
  const push = await syncShare(p.laptop, { pushOnly: true });
  assert.deepEqual([push.ok, push.pushed, sh(["ls-tree", "--name-only", "HEAD", "plans/"], p.bare)], [true, 1, "plans/x.md"]);
  clean(p.laptop);
});
test("debounce: a sync that ran less than N seconds ago is not repeated — the remote is not even asked", async () => {
  const p = pair(); assert.equal((await syncShare(p.laptop, {})).ok, true);
  commitAt(p.desk, SETTINGS, '{"model":"sonnet"}\n', "2026-09-10T10:00:00Z"); sh(["push", "-q", "origin", "main"], p.desk.path);
  assert.deepEqual([(await syncShare(p.laptop, { debounce: 3600 })).ok, read(p.laptop, SETTINGS)], [true, '{"model":"opus"}\n']);
  assert.deepEqual([(await syncShare(p.laptop, { debounce: 0 })).ok, read(p.laptop, SETTINGS)], [true, '{"model":"sonnet"}\n']);
  clean(p.laptop);
});
/** The desk's checkout of project `a` under ~/dev, as a git repo. */
function checkout(): string { const co = join(tmp, "dev", "a"); rmSync(co, { recursive: true, force: true }); mkdirSync(co); sh(["init", "-q", co]); return co; }
test("copy-back: what a checkout changed in its Claude files goes into the project state before the share commits, and reaches the other machine", async () => {
  const p = pair(); const co = checkout(); writeFileSync(join(co, "CLAUDE.md"), "# a v2\n");
  const r = await syncShare(p.desk, {});
  assert.deepEqual([r.ok, r.pushed, read(p.desk, "projects/a/CLAUDE.md"), sh(["status", "--porcelain"], p.desk.path)], [true, 1, "# a v2\n", ""]);
  assert.equal((await syncShare(p.laptop, {})).ok, true);
  assert.equal(read(p.laptop, "projects/a/CLAUDE.md"), "# a v2\n");
  clean(p.desk); clean(p.laptop);
});
test("after a pull: settings that arrived are rendered into ~/.claude and project state placed into the checkout in the same run", async () => {
  const p = pair(); const co = checkout(); assert.equal((await syncShare(p.desk, {})).ok, true);
  commitAt(p.laptop, SETTINGS, '{"model":"sonnet"}\n', "2026-09-10T10:00:00Z"); commitAt(p.laptop, "projects/a/CLAUDE.md", "# from laptop\n", "2026-09-10T10:01:00Z"); sh(["push", "-q", "origin", "main"], p.laptop.path);
  assert.equal((await syncShare(p.desk, {})).ok, true);
  assert.equal(JSON.parse(readFileSync(join(tmp, "claude", "settings.json"), "utf8")).model, "sonnet");
  assert.equal(readFileSync(join(co, "CLAUDE.md"), "utf8"), "# from laptop\n");
  clean(p.desk);
});
