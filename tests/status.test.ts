/** The unregistered-directory scan at its seam: a throwaway workspace with one directory of every kind, and what bare `cs`
 *  and `cs doctor` are handed back — the kind of each, which project a second clone belongs to, and what is not there at all. */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { unregisteredDirs } from "../src/status.ts";
import { parseManifest } from "../src/manifest.ts";
import type { Share } from "../src/share.ts";
import { ignoreDirs, loadMachine, saveMachine, unignoreDir, type Machine } from "../src/machine.ts";
import { machineFile } from "../src/paths.ts";

let tmp: string, ws: string;
const sh = (args: string[], cwd?: string) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
before(() => {
  tmp = mkdtempSync(join(tmpdir(), "cs-status-")); ws = join(tmp, "dev"); mkdirSync(ws);
  process.env.HOME = tmp; process.env.XDG_STATE_HOME = join(tmp, "state"); process.env.CS_CONFIG_DIR = join(tmp, "cs");
  process.env.GIT_CONFIG_GLOBAL = join(tmp, "gitconfig"); writeFileSync(process.env.GIT_CONFIG_GLOBAL, "[user]\n\tname = Tester\n\temail = tester@example.invalid\n[init]\n\tdefaultBranch = main\n");
});
after(() => rmSync(tmp, { recursive: true, force: true }));

const MANIFEST = `schema_version = 1\n[workspace]\nroot = "~/dev"\n[identities.acme]\nowner = "acme"\nname = "A"\nemail = "a@example.invalid"\n[projects.a]\nurl = "git@github.com:acme/a.git"\nidentity = "acme"\nprofiles = ["all"]\n[projects.b]\nurl = "git@github.com:acme/b.git"\nidentity = "acme"\nprofiles = ["other"]\npath = "b-dir"\n`;
const share = (ignore: string[]): Share => ({ path: join(tmp, "share"), machine: { name: "desk", profiles: ["personal"], exclude: [], ignore, workspace: ws, secretsBackend: "none" }, manifest: parseManifest(MANIFEST) });
/** A git repo under the workspace, with `remote` as origin when given. */
function repo(name: string, remote?: string) { const d = join(ws, name); sh(["init", "-q", d]); if (remote) sh(["remote", "add", "origin", remote], d); }

test("unregisteredDirs: every kind classified, sorted; registered, ignored and dot directories absent", () => {
  mkdirSync(join(ws, "a")); mkdirSync(join(ws, "b-dir"));                          // registered by name and by path
  repo("a-scratch", "https://github.com/acme/a.git");                              // a second clone of a, other url form
  repo("b-clone", "git@github.com:acme/b.git");                                    // a clone of b — registered, not selected here
  repo("foreign", "git@github.com:other/x.git");
  repo("local");
  mkdirSync(join(ws, "notes")); writeFileSync(join(ws, "notes", "x.md"), "x");
  mkdirSync(join(ws, "empty"));
  mkdirSync(join(ws, "junk")); writeFileSync(join(ws, "junk", "x"), "x");         // ignored here
  mkdirSync(join(ws, ".hidden"));
  assert.deepEqual(unregisteredDirs(share(["junk", "gone"])), [
    { name: "a-scratch", kind: "clone", of: "a" },
    { name: "b-clone", kind: "clone", of: "b" },
    { name: "empty", kind: "empty" },
    { name: "foreign", kind: "foreign" },
    { name: "local", kind: "no-remote" },
    { name: "notes", kind: "plain" },
  ]);
  assert.ok(unregisteredDirs(share([])).some((d) => d.name === "junk" && d.kind === "plain"));
});
test("unregisteredDirs: no workspace directory yet → nothing", () => {
  assert.deepEqual(unregisteredDirs({ ...share([]), machine: { ...share([]).machine, workspace: join(tmp, "nowhere") } }), []);
});

test("machine.toml: ignore round-trips, defaults to none for a file without the key; ignoreDirs says what was new and what already was; unignoreDir is idempotent", () => {
  const m: Machine = { name: "desk", profiles: ["personal"], exclude: [], ignore: [], secretsBackend: "none" };
  saveMachine(m); assert.deepEqual(loadMachine().ignore, []);
  assert.deepEqual(ignoreDirs(m, ["junk", "old", "junk"]), { added: ["junk", "old"], already: [] });
  assert.deepEqual(loadMachine().ignore, ["junk", "old"]);
  assert.deepEqual(ignoreDirs(m, ["junk", "new"]), { added: ["new"], already: ["junk"] });
  unignoreDir(m, "junk"); unignoreDir(m, "junk");
  assert.deepEqual(loadMachine().ignore, ["old", "new"]);
  writeFileSync(machineFile(), 'name = "desk"\nprofiles = ["personal"]\nexclude = []\n');
  assert.deepEqual(loadMachine().ignore, []);
});
