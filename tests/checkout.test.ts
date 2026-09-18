/** The Checkout module at its seam: real git repositories in a temp directory — a bare remote and clones of it — never a fake git.
 *  Each test asserts what a user could observe afterwards: the refs on the remote, the files in a checkout, the facts returned. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { apply, dirs, fetchWaiting, locate, present, push, send, sniff, type Absence, type Checkout } from "../src/checkout.ts";
import * as ui from "../src/ui.ts";
import type { Project } from "../src/manifest.ts";

// ---------------------------------------------------------------- fixture: a throwaway HOME, a bare remote per project, clones as checkouts
let tmp: string, ws: string, remotes: string;
const sh = (args: string[], cwd?: string) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
before(() => {
  tmp = mkdtempSync(join(tmpdir(), "cs-checkout-")); ws = join(tmp, "dev"); remotes = join(tmp, "remotes"); mkdirSync(ws); mkdirSync(remotes);
  process.env.HOME = tmp; process.env.XDG_STATE_HOME = join(tmp, "state"); process.env.CS_CONFIG_DIR = join(tmp, "cs");
  for (const k of ["GIT_AUTHOR_NAME", "GIT_COMMITTER_NAME"]) process.env[k] = "Tester"; for (const k of ["GIT_AUTHOR_EMAIL", "GIT_COMMITTER_EMAIL"]) process.env[k] = "tester@example.invalid";
  process.env.GIT_CONFIG_GLOBAL = join(tmp, "gitconfig"); writeFileSync(process.env.GIT_CONFIG_GLOBAL, "[user]\n\tname = Tester\n\temail = tester@example.invalid\n[init]\n\tdefaultBranch = main\n");
});
after(() => rmSync(tmp, { recursive: true, force: true }));

const proj = (name: string, o: Partial<Project> = {}): Project => ({ name, profiles: ["all"], machines: [], layout: "plain", handoff: {}, url: `${remotes}/${name}.git`, ...o });
/** A project with a bare remote holding one commit on main, cloned into the workspace (or `into`). */
function seed(name: string, into = join(ws, name)): string {
  const bare = join(remotes, `${name}.git`); sh(["init", "-q", "--bare", "-b", "main", bare]);
  const stage = join(tmp, `stage-${name}-${Date.now()}`); sh(["clone", "-q", bare, stage]);
  writeFileSync(join(stage, "README.md"), `# ${name}\n`); sh(["add", "README.md"], stage); sh(["commit", "-q", "-m", "init"], stage); sh(["push", "-q", "origin", "main"], stage);
  rmSync(stage, { recursive: true, force: true });
  sh(["clone", "-q", bare, into]);
  return into;
}

// ---------------------------------------------------------------- locate: presence, absence and the layout rule
test("locate: a plain checkout is present with one clean unit on its branch", () => {
  const root = seed("plain");
  const c = locate(proj("plain"), ws);
  assert.ok(present(c));
  assert.equal(c.root, root); assert.equal(c.container, root);
  assert.deepEqual(c.units.map((u) => ({ path: u.path, rel: u.rel, branch: u.branch, dirty: u.dirty, unpushed: u.unpushed })), [{ path: root, rel: ".", branch: "main", dirty: 0, unpushed: 0 }]);
});
test("locate: missing, not a git repo, no remote are absences with the reason (ADR-0001: never a Checkout)", () => {
  const why = (p: Project) => { const c = locate(p, ws); assert.ok(!present(c)); return (c as Absence).why; };
  assert.equal(why(proj("nowhere")), "missing");
  mkdirSync(join(ws, "notgit")); writeFileSync(join(ws, "notgit", "x"), "");
  assert.equal(why(proj("notgit")), "not a git repo");
  sh(["init", "-q", join(ws, "noremote")]);
  assert.equal(why(proj("noremote")), "no remote");
});
test("locate: worktrees layout — the repo under `repo`, each worktree a unit named by its directory", () => {
  const cont = join(ws, "wt"); const root = seed("wt", join(cont, "repo"));
  sh(["worktree", "add", "-q", "-b", "feat", join(cont, "wt-feat")], root);
  const c = locate(proj("wt", { layout: "worktrees" }), ws);
  assert.ok(present(c)); assert.equal(c.root, root); assert.equal(c.container, cont);
  assert.deepEqual(c.units.map((u) => [u.rel, u.branch]), [["repo", "main"], ["wt-feat", "feat"]]);
});
test("locate: units carry the facts the plan needs — dirty, unpushed, detached, on a handoff ref, files that look secret", () => {
  const root = seed("facts");
  writeFileSync(join(root, "a.txt"), "x"); writeFileSync(join(root, ".env"), "K=v"); sh(["commit", "-q", "--allow-empty", "-m", "local only"], root);
  const u = (locate(proj("facts"), ws) as Checkout).units[0];
  assert.deepEqual([u.dirty, u.unpushed, u.skip, u.secrets], [2, 1, undefined, [".env"]]);
  sh(["checkout", "-q", "--detach"], root);
  assert.equal((locate(proj("facts"), ws) as Checkout).units[0].skip, "detached HEAD");
  sh(["checkout", "-q", "-b", "handoff/tester/main"], root);
  assert.equal((locate(proj("facts"), ws) as Checkout).units[0].skip, "on a handoff ref");
});
test("sniff: an unregistered directory's layout is read from the disk", () => {
  const cont = join(ws, "sniffed"); mkdirSync(join(cont, "repo"), { recursive: true }); sh(["init", "-q", join(cont, "repo")]);
  assert.deepEqual(sniff(cont), { root: join(cont, "repo"), layout: "worktrees" });
  assert.deepEqual(sniff(join(ws, "plain")), { root: join(ws, "plain"), layout: "plain" });
});
test("dirs: the checkout directories for placement — every unit, or the bare directory before it is a repo, or nothing", () => {
  assert.deepEqual(dirs(proj("wt", { layout: "worktrees" }), ws), [join(ws, "wt", "repo"), join(ws, "wt", "wt-feat")]);
  assert.deepEqual(dirs(proj("notgit"), ws), [join(ws, "notgit")]);
  assert.deepEqual(dirs(proj("nowhere"), ws), []);
});

// ---------------------------------------------------------------- send → fetchWaiting → apply: the round trip between two machines
const desk = { name: "desk", profiles: ["all"], exclude: [], ignore: [], secretsBackend: "none" as const }, laptop = { ...desk, name: "laptop" };
const co = (p: Project) => { const c = locate(p, ws); assert.ok(present(c), `${p.name}: ${(c as Absence).why}`); return c; };
const quiet = async <T>(fn: () => Promise<T>) => { const was = ui.isQuiet(); ui.setQuiet(true); try { return await fn(); } finally { ui.setQuiet(was); } };

test("send → apply: uncommitted work and a local-only commit travel as one handoff and arrive as uncommitted changes; the ref is removed", async () => {
  const a = seed("trip"); const b = join(ws, "trip-b"); sh(["clone", "-q", join(remotes, "trip.git"), b]);
  writeFileSync(join(a, ".gitignore"), "build/\n"); sh(["add", ".gitignore"], a); sh(["commit", "-q", "-m", "ignore"], a); sh(["push", "-q"], a); sh(["pull", "-q"], b);
  writeFileSync(join(a, "work.txt"), "in progress\n"); writeFileSync(join(a, "README.md"), "# trip\nmore\n"); sh(["commit", "-q", "-am", "local only"], a);
  mkdirSync(join(a, "build")); writeFileSync(join(a, "build", "out"), "junk\n");   // gitignored: stays here
  const pa = proj("trip"), pb = proj("trip", { path: "trip-b" });
  const before = sh(["status", "--porcelain"], a);
  const sent = await quiet(() => send(co(pa), co(pa).units[0], desk, { note: "carry on" }));
  assert.ok(sent.ok); assert.equal(sent.ref, "handoff/tester/main");
  assert.equal(sh(["status", "--porcelain"], a), before); assert.equal(sh(["diff", "--cached", "--stat"], a), "");   // the sender's tree and index untouched
  assert.ok(!sh(["ls-tree", "-r", "--name-only", "handoff/tester/main"], join(remotes, "trip.git")).includes("build/out"));
  const w = await fetchWaiting(co(pb), { timeout: 10 });
  assert.ok(w.ok); assert.deepEqual(w.list.map((h) => [h.branch, h.machine, h.note]), [["main", "desk", "carry on"]]);
  const applied = await quiet(() => apply(co(pb), w.list[0], laptop, {}));
  assert.ok(applied.ok); assert.equal(applied.path, b); assert.equal(applied.note, "carry on\n");
  assert.equal(readFileSync(join(b, "work.txt"), "utf8"), "in progress\n"); assert.equal(sh(["log", "-1", "--format=%s"], b), "local only");
  assert.ok(!existsSync(join(b, ".cs-handoff")) && !existsSync(join(b, "build")));   // the sidecar is gone; nothing gitignored arrived
  assert.deepEqual(co(pb).units[0].dirty, 1); assert.equal(sh(["diff", "--cached", "--stat"], b), "");   // arrived unstaged
  assert.deepEqual((await fetchWaiting(co(pb), { timeout: 10 })).list, []);
  assert.equal(sh(["ls-remote", "--heads", join(remotes, "trip.git"), "handoff/*"]), "");
});
test("send: another machine's handoff on the ref is refused unless the plan said to send over it — then it is backed up first", async () => {
  const a = seed("lease"); const b = join(ws, "lease-b"); sh(["clone", "-q", join(remotes, "lease.git"), b]);
  const pa = proj("lease"), pb = proj("lease", { path: "lease-b" });
  writeFileSync(join(a, "desk.txt"), "desk\n"); assert.ok((await quiet(() => send(co(pa), co(pa).units[0], desk, { note: "from desk" }))).ok);
  writeFileSync(join(b, "laptop.txt"), "laptop\n");
  const refused = await quiet(() => send(co(pb), co(pb).units[0], laptop, { note: "from laptop" }));
  assert.ok(!refused.ok);
  const theirs = (await fetchWaiting(co(pb), { timeout: 10 })).list[0]; assert.equal(theirs.machine, "desk");
  const over = await quiet(() => send(co(pb), co(pb).units[0], laptop, { note: "from laptop", over: theirs }));
  assert.ok(over.ok);
  const backups = sh(["for-each-ref", "--format=%(refname)", "refs/cs/backup/"], b).split("\n"); assert.equal(backups.length, 1); assert.match(backups[0], /^refs\/cs\/backup\/main\/\d+$/);
  assert.equal(sh(["show", `${backups[0]}:desk.txt`], b), "desk");   // the desk handoff survives in the backup ref
  assert.deepEqual((await fetchWaiting(co(pa), { timeout: 10 })).list.map((h) => h.machine), ["laptop"]);
});
test("apply: a dirty unit is refused; with replace its changes go to a backup ref and the handoff lands", async () => {
  const a = seed("replace"); const b = join(ws, "replace-b"); sh(["clone", "-q", join(remotes, "replace.git"), b]);
  const pa = proj("replace"), pb = proj("replace", { path: "replace-b" });
  writeFileSync(join(a, "theirs.txt"), "theirs\n"); assert.ok((await quiet(() => send(co(pa), co(pa).units[0], desk, { note: "n" }))).ok);
  writeFileSync(join(b, "mine.txt"), "mine\n");
  const h = (await fetchWaiting(co(pb), { timeout: 10 })).list[0];
  assert.ok(!(await quiet(() => apply(co(pb), h, laptop, {}))).ok);
  assert.equal(readFileSync(join(b, "mine.txt"), "utf8"), "mine\n");   // refused: nothing touched
  assert.ok((await quiet(() => apply(co(pb), h, laptop, { replace: true }))).ok);
  assert.equal(readFileSync(join(b, "theirs.txt"), "utf8"), "theirs\n"); assert.ok(!existsSync(join(b, "mine.txt")));
  const backup = sh(["for-each-ref", "--format=%(refname)", "refs/cs/backup/"], b); assert.equal(sh(["show", `${backup}:mine.txt`], b), "mine");
});
test("send: a secret-looking file that appeared after the plan is still refused; allow globs pass it", async () => {
  const a = seed("deny"); const p = proj("deny");
  writeFileSync(join(a, "work.txt"), "w\n"); const c = co(p); assert.deepEqual(c.units[0].secrets, []);
  writeFileSync(join(a, "id.key"), "k\n");   // after the plan screen
  assert.ok(!(await quiet(() => send(c, c.units[0], desk, { note: "n" }))).ok);
  assert.equal(sh(["ls-remote", "--heads", join(remotes, "deny.git"), "handoff/*"]), "");
  assert.ok((await quiet(() => send(c, c.units[0], desk, { note: "n", allow: ["*.key"] }))).ok);
});
test("apply: in a worktrees checkout a handoff for a branch with no worktree gets one under wt-<branch>", async () => {
  const cont = join(ws, "wtb"); const a = seed("wtb", join(cont, "repo")); sh(["worktree", "add", "-q", "-b", "feat", join(cont, "wt-feat")], a);
  const contB = join(ws, "wtb-b"); mkdirSync(contB); sh(["clone", "-q", join(remotes, "wtb.git"), join(contB, "repo")]);
  const pa = proj("wtb", { layout: "worktrees" }), pb = proj("wtb", { layout: "worktrees", path: "wtb-b" });
  writeFileSync(join(cont, "wt-feat", "f.txt"), "f\n");
  const feat = co(pa).units.find((u) => u.branch === "feat")!; assert.ok((await quiet(() => send(co(pa), feat, desk, { note: "n" }))).ok);
  const h = (await fetchWaiting(co(pb), { timeout: 10 })).list[0]; assert.equal(h.worktree, "wt-feat");
  const r = await quiet(() => apply(co(pb), h, laptop, {}));
  assert.ok(r.ok && r.created); assert.equal(r.path, join(contB, "wt-feat"));
  assert.equal(readFileSync(join(contB, "wt-feat", "f.txt"), "utf8"), "f\n");
  assert.deepEqual(co(pb).units.map((u) => [u.rel, u.branch, u.dirty]), [["repo", "main", 0], ["wt-feat", "feat", 1]]);
});
test("push: a unit's local-only commits go to the branch's upstream, never forced; no upstream is a refusal", async () => {
  const a = seed("push"); const p = proj("push");
  sh(["commit", "-q", "--allow-empty", "-m", "ahead"], a);
  const u = co(p).units[0]; assert.equal(u.unpushed, 1);
  const r = await quiet(() => push(co(p), u)); assert.ok(r.ok); assert.equal(r.to, "origin/main");
  assert.equal(sh(["log", "-1", "--format=%s", "main"], join(remotes, "push.git")), "ahead");
  assert.equal(co(p).units[0].unpushed, 0);
  sh(["checkout", "-q", "-b", "orphan"], a); sh(["commit", "-q", "--allow-empty", "-m", "x"], a);
  assert.ok(!(await quiet(() => push(co(p), co(p).units[0]))).ok);
});
