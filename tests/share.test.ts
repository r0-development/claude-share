/** The Share module at its seam: a real git repository in a temp directory is the share; every test asserts what a caller
 *  can observe afterwards — the manifest the same object now holds, the share's history, the stamp read back from a file. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { open, addProject, updateProject, removeProject, addIdentity, renameIdentity, commit, stampOf, workspace, selectedProjects, projectForPath, type Share } from "../src/share.ts";
import type { Machine } from "../src/machine.ts";

// ---------------------------------------------------------------- fixture: a share per test, initialised with one committed manifest
let tmp: string; let n = 0;
const sh = (args: string[], cwd?: string) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const machine: Machine = { name: "desk", profiles: ["personal"], exclude: [], secretsBackend: "none" };
const MANIFEST = `schema_version = 1\n\n[workspace]\nroot = "~/dev"\n\n[identities.acme]\nowner = "acme"\nname = "A"\nemail = "a@example.invalid"\n\n# ---- Projects\n\n[projects.a]   # first\nurl = "git@github.com:acme/a.git"\nidentity = "acme"\nprofiles = ["all"]\n`;
before(() => {
  tmp = mkdtempSync(join(tmpdir(), "cs-share-"));
  process.env.HOME = tmp; process.env.XDG_STATE_HOME = join(tmp, "state"); process.env.CS_CONFIG_DIR = join(tmp, "cs");
  process.env.GIT_CONFIG_GLOBAL = join(tmp, "gitconfig"); writeFileSync(process.env.GIT_CONFIG_GLOBAL, "[user]\n\tname = Tester\n\temail = tester@example.invalid\n[init]\n\tdefaultBranch = main\n");
});
after(() => rmSync(tmp, { recursive: true, force: true }));
/** A fresh share: a git repo holding the manifest, committed. `git: false` leaves it a bare directory (a skeleton before cs init). */
function share(o: { git?: boolean } = {}): Share {
  const dir = join(tmp, `share-${++n}`); mkdirSync(dir); writeFileSync(join(dir, "projects.toml"), MANIFEST);
  if (o.git !== false) { sh(["init", "-q", dir]); sh(["add", "-A"], dir); sh(["commit", "-q", "-m", "skeleton"], dir); }
  return open(machine, dir);
}
const proj = (name: string) => ({ name, url: `git@github.com:acme/${name}.git`, identity: "acme", profiles: ["all"], machines: [], layout: "plain" as const, handoff: {} });

// ---------------------------------------------------------------- manifest writes reload the same object
test("open: the share knows its path, this machine and the manifest", () => {
  const s = share();
  assert.deepEqual([s.machine.name, Object.keys(s.manifest.projects), Object.keys(s.manifest.identities)], ["desk", ["a"], ["acme"]]);
});
test("addProject: the file gains the block and the same Share sees the project without re-reading", () => {
  const s = share(); const before = readFileSync(join(s.path, "projects.toml"), "utf8");
  addProject(s, proj("b"));
  assert.deepEqual(Object.keys(s.manifest.projects), ["a", "b"]);
  assert.equal(readFileSync(join(s.path, "projects.toml"), "utf8"), before + `\n[projects.b]\nurl = "git@github.com:acme/b.git"\nidentity = "acme"\nprofiles = [ "all" ]\n`);
});
test("updateProject / removeProject: the same object follows each write; remove says whether there was anything to remove", () => {
  const s = share();
  updateProject(s, { ...proj("a"), branch: "develop" });
  assert.equal(s.manifest.projects.a.branch, "develop");
  assert.equal(removeProject(s, "a"), true);
  assert.deepEqual(Object.keys(s.manifest.projects), []);
  assert.equal(removeProject(s, "a"), false);
  assert.equal(readFileSync(join(s.path, "projects.toml"), "utf8"), `schema_version = 1\n\n[workspace]\nroot = "~/dev"\n\n[identities.acme]\nowner = "acme"\nname = "A"\nemail = "a@example.invalid"\n\n# ---- Projects\n`);
});
test("addIdentity / renameIdentity: the identity lands before the projects and a rename follows through to the projects that use it", () => {
  const s = share();
  addIdentity(s, { id: "corp", name: "C", email: "c@example.invalid", owner: "corp" });
  assert.deepEqual(Object.keys(s.manifest.identities), ["acme", "corp"]);
  renameIdentity(s, "acme", "me");
  assert.deepEqual([Object.keys(s.manifest.identities), s.manifest.projects.a.identity], [["me", "corp"], "me"]);
  assert.ok(readFileSync(join(s.path, "projects.toml"), "utf8").includes(`[identities.corp]\nowner = "corp"\nname = "C"\nemail = "c@example.invalid"\n\n# ---- Projects`));
});

// ---------------------------------------------------------------- commit: as this machine
test("commit: stages only the named paths (share-relative or absolute), returns the short sha, subject as given; nothing staged → undefined", () => {
  const s = share();
  writeFileSync(join(s.path, "a.txt"), "a"); mkdirSync(join(s.path, "secrets")); writeFileSync(join(s.path, "secrets", "x.env"), "K=1"); writeFileSync(join(s.path, "b.txt"), "b");
  const sha = commit(s, "secrets: x", ["a.txt", join(s.path, "secrets")]);
  assert.match(sha ?? "", /^[0-9a-f]{7,}$/);
  assert.equal(sh(["log", "-1", "--format=%s"], s.path), "secrets: x");
  assert.equal(sh(["status", "--porcelain"], s.path), "?? b.txt");
  assert.equal(commit(s, "again", ["a.txt"]), undefined);                 // clean path: no empty commit
  assert.equal(sh(["log", "--format=%s"], s.path), "secrets: x\nskeleton");
  assert.match(commit(s, "the rest") ?? "", /^[0-9a-f]{7,}$/);            // no paths: everything
  assert.equal(sh(["status", "--porcelain"], s.path), "");
});
test("commit: a share that is not a git repo yet is left alone", () => {
  const s = share({ git: false }); writeFileSync(join(s.path, "a.txt"), "a");
  assert.equal(commit(s, "nope"), undefined);
});

// ---------------------------------------------------------------- stampOf: when and from which machine — the contract commit() encodes
test("stampOf: a file committed by this machine reads back its machine and commit time; modified since → the mtime and no machine", () => {
  const s = share(); writeFileSync(join(s.path, "a.txt"), "a"); commit(s, "a", ["a.txt"]);
  assert.equal(sh(["log", "-1", "--format=%B", "--", "a.txt"], s.path), "a\n\nCs-Machine: desk");   // the wire form: subject as given, the machine a trailer
  const st = stampOf(s, "a.txt");
  assert.deepEqual(st, { when: sh(["log", "-1", "--format=%cI", "--", "a.txt"], s.path), from: "desk" });
  assert.deepEqual(stampOf(s, join(s.path, "a.txt")), st);                              // absolute path, same answer
  writeFileSync(join(s.path, "a.txt"), "changed");
  const dirty = stampOf(s, "a.txt");
  assert.equal(dirty.from, undefined); assert.notEqual(dirty.when, st.when); assert.ok(!Number.isNaN(Date.parse(dirty.when)));
});
test("stampOf: history from before the trailer still decodes — a sync(<machine>) subject, then a cs@<machine> author; a human's commit names no machine", () => {
  const s = share();
  const old = (file: string, subject: string, email: string) => { writeFileSync(join(s.path, file), file); sh(["add", file], s.path); sh(["-c", `user.email=${email}`, "-c", "user.name=x", "commit", "-q", "-m", subject], s.path); };
  old("sync.txt", "sync(laptop): 1 file(s) 2026-09-01 10:00", "someone@example.invalid");
  old("email.txt", "secrets: set", "cs@office");
  old("human.txt", "edited by hand", "someone@example.invalid");
  assert.deepEqual([stampOf(s, "sync.txt").from, stampOf(s, "email.txt").from, stampOf(s, "human.txt").from], ["laptop", "office", undefined]);
});

// ---------------------------------------------------------------- what hangs off the share: the workspace and the projects this machine gets
test("workspace / selectedProjects / projectForPath: the machine's overrides applied to the manifest, and they follow a reload", () => {
  const s = share();
  assert.equal(workspace(s), join(tmp, "dev"));                                          // ~/dev under this HOME
  assert.deepEqual(selectedProjects(s).map((p) => p.name), ["a"]);
  assert.equal(projectForPath(s, join(tmp, "dev", "a", "src"))?.name, "a");
  addProject(s, { ...proj("w"), profiles: ["work"] });
  assert.deepEqual(selectedProjects(s).map((p) => p.name), ["a"]);                      // work is not this machine's profile
  const office = open({ ...machine, name: "office", profiles: ["work"], workspace: "~/code" }, s.path);
  assert.deepEqual([workspace(office), selectedProjects(office).map((p) => p.name)], [join(tmp, "code"), ["a", "w"]]);
});
