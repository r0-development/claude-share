import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeLayers, diffKeys } from "../src/jsonmerge.ts";
import { parseManifest, validate, selected, identityForUrl, projectBlock, globs, globMatch, hasRemote } from "../src/manifest.ts";
import { canonicalGithub } from "../src/git.ts";
import { parseRepoUrl } from "../src/sharekey.ts";
import { envVarName } from "../src/import.ts";
import { parseDotenv, dumpDotenv } from "../src/secrets/index.ts";
import { plan, type Facts } from "../src/plan.ts";

test("jsonmerge: dicts recurse, scalars override, permission lists union, plain lists replace", () => {
  assert.deepEqual(mergeLayers({ a: { x: 1 } }, { a: { y: 2 } }), { a: { x: 1, y: 2 } });
  assert.deepEqual(mergeLayers({ model: "opus" }, { model: "sonnet" }), { model: "sonnet" });
  assert.deepEqual(mergeLayers({ l: [1, 2] }, { l: [3] }), { l: [3] });
  assert.deepEqual((mergeLayers({ permissions: { allow: ["A", "B"] } }, { permissions: { allow: ["B", "C"] } }) as any).permissions.allow, ["A", "B", "C"]);
  assert.deepEqual(diffKeys({ a: { x: 1 }, b: 1 }, { a: { x: 2 }, c: 1 }), ["a.x", "b", "c"]);
});
const TOML = `schema_version = 1\n[workspace]\nroot = "~/dev"\n[identities.work]\nname = "W"\nemail = "w@x"\nowner = "acme"\n[projects.a]\nkind = "git"\nurl = "git@github.com:acme/a.git"\nidentity = "work"\nprofiles = ["work"]\n[projects.b]\nkind = "synced"\nprofiles = ["all"]\n[projects.c]\nmachines = ["m1"]\n`;
test("manifest: parse, validate, select, identity globs, block round-trip", () => {
  const m = parseManifest(TOML);
  assert.deepEqual(validate(m), []);
  assert.deepEqual(Object.keys(m.projects).sort(), ["a", "b", "c"]);
  // `kind` is ignored: a project is a project; one without a url is merely remote-less (flagged by cs / cs doctor)
  assert.ok(!("kind" in m.projects.a) && hasRemote(m.projects.a) && !hasRemote(m.projects.b) && !hasRemote(m.projects.c));
  assert.ok(!projectBlock(m.projects.a).includes("kind"));
  const mach = (name: string, profiles: string[], exclude: string[] = []) => ({ name, profiles, exclude, secretsBackend: "sops" as const });
  assert.deepEqual(Object.values(m.projects).filter((p) => selected(p, mach("m1", ["work"]))).map((p) => p.name), ["a", "b", "c"]);
  assert.deepEqual(Object.values(m.projects).filter((p) => selected(p, mach("m2", ["personal"], ["b"]))).map((p) => p.name), []);
  assert.deepEqual(globs(m.identities.work), ["git@github.com:acme/**"]);
  assert.equal(identityForUrl(m, "git@github.com:acme/zzz.git")?.id, "work");
  assert.equal(identityForUrl(m, "git@github.com:other/zzz.git"), undefined);
  assert.ok(globMatch("git@github.com:acme/**", "git@github.com:acme/x/y.git"));
  assert.ok(globMatch("**/*.key", "api.key") && globMatch("**/*.key", "a/b/api.key") && !globMatch("**/*.key", "api.keyx"));
  assert.ok(globMatch("**/.env*", ".env.local") && globMatch("*token*", "my-token.txt") && !globMatch("*.pem", "a/b.pem"));
  const bad = parseManifest(TOML + "[projects.d]\nkind = \"git\"\nurl = \"git@github.com:other/d.git\"\nidentity = \"work\"\n");
  assert.ok(validate(bad).some((e) => e.includes("does not match identity")));
  const again = parseManifest(TOML + "\n" + projectBlock({ name: "x", url: "git@github.com:acme/x.git", identity: "work", profiles: ["work"], machines: [], layout: "worktrees", handoff: {} })).projects.x;
  assert.deepEqual([again.url, again.identity, again.layout, again.profiles], ["git@github.com:acme/x.git", "work", "worktrees", ["work"]]);
});
test("git: canonical GitHub url forms collapse", () => {
  for (const u of ["git@github.com:org/repo", "git@github-personal:org/repo.git", "https://github.com/org/repo", "ssh://git@github.com/org/repo.git"]) assert.equal(canonicalGithub(u), "git@github.com:org/repo.git", u);
});
test("sharekey: repo url parsing", () => {
  for (const u of ["https://github.com/o/r", "https://github.com/o/r.git", "https://github.com/o/r/", "github.com/o/r", "git@github.com:o/r", "ssh://git@github.com/o/r.git", "https://www.github.com/o/r"]) assert.deepEqual(parseRepoUrl(u), ["git@github.com:o/r.git", ["o", "r"]], u);
  assert.deepEqual(parseRepoUrl("git@gitea.local:me/cfg.git"), ["git@gitea.local:me/cfg.git", undefined]);
});
test("import: env var names; dotenv round trip", () => {
  assert.equal(envVarName("coolify-teido", "COOLIFY_BASE_URL"), "COOLIFY_TEIDO_BASE_URL");
  assert.equal(envVarName("coolify", "COOLIFY_ACCESS_TOKEN"), "COOLIFY_ACCESS_TOKEN");
  const v = { A: "1", B: "with space", C: "q\"uote" };
  assert.deepEqual(parseDotenv(dumpDotenv(v)), v);
});

// cs sync plan: facts (what was observed) → actions with defaults + questions for a human. No I/O.
const facts = (over: Partial<Facts>): Facts => ({ project: "p", layout: "plain", units: [{ rel: ".", branch: "main", dirty: 0, unpushed: 0 }], waiting: [], ...over });
const w = (branch: string, machine: string) => ({ branch, machine, when: "2026-09-16T08:00:00+00:00", note: "", ref: `wip/u/${branch}` });
test("plan: table of facts → actions", () => {
  const cases: [string, Facts, { actions: string[]; checked?: boolean[]; questions?: string[]; skipped?: number }][] = [
    ["clean, nothing waiting", facts({}), { actions: [] }],
    ["dirty → send, checked", facts({ units: [{ rel: ".", branch: "main", dirty: 3, unpushed: 0 }] }), { actions: ["send:p:main"], checked: [true] }],
    ["unpushed commits only → send (the handoff carries them)", facts({ units: [{ rel: ".", branch: "main", dirty: 0, unpushed: 2 }] }), { actions: ["send:p:main"] }],
    ["clean + waiting from another machine → apply, checked", facts({ waiting: [w("main", "laptop")] }), { actions: ["apply:p:main"], checked: [true] }],
    ["clean + waiting on another branch (plain layout) → apply (checks the branch out)", facts({ waiting: [w("feat", "laptop")] }), { actions: ["apply:p:feat"] }],
    ["dirty + waiting from another machine, same branch → question, no actions", facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }], waiting: [w("main", "laptop")] }), { actions: [], questions: ["dirty-vs-waiting"] }],
    ["dirty + waiting for another branch (plain) → the dirty work is sent; applying needs a clean root → question", facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }], waiting: [w("feat", "laptop")] }), { actions: ["send:p:main"], questions: ["dirty-vs-waiting"] }],
    ["dirty + my own earlier handoff waiting → send again (replaces it), no apply", facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }], waiting: [w("main", "desk")] }), { actions: ["send:p:main"] }],
    ["clean + my own handoff waiting → apply it (the work comes back)", facts({ waiting: [w("main", "desk")] }), { actions: ["apply:p:main"] }],
    ["worktrees: waiting for a branch with no worktree → apply; dirty worktree on another branch is sent", facts({ layout: "worktrees", units: [{ rel: "wt-a", branch: "a", dirty: 2, unpushed: 0 }], waiting: [w("b", "laptop")] }), { actions: ["apply:p:b", "send:p:a"] }],
    ["worktrees: waiting for a branch whose worktree is dirty → question", facts({ layout: "worktrees", units: [{ rel: "wt-b", branch: "b", dirty: 2, unpushed: 0 }], waiting: [w("b", "laptop")] }), { actions: [], questions: ["dirty-vs-waiting"] }],
    ["detached / on a handoff ref → skipped with a reason", facts({ units: [{ rel: ".", branch: "", dirty: 1, unpushed: 0, skip: "detached HEAD" }] }), { actions: [], skipped: 1 }],
    ["files that look secret → not sent, skipped with the files", facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0, secrets: ["api.key"] }] }), { actions: [], skipped: 1 }],
    ["remote unreachable → nothing planned, one skipped line", facts({ offline: true, units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }], waiting: [w("main", "laptop")] }), { actions: [], skipped: 1 }],
    ["handoff disabled for the project → skipped", facts({ disabled: true, units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }] }), { actions: [], skipped: 1 }],
  ];
  for (const [name, f, want] of cases) {
    const pl = plan([f], "desk");
    assert.deepEqual(pl.actions.map((a) => a.id), want.actions, name);
    if (want.checked) assert.deepEqual(pl.actions.map((a) => a.checked), want.checked, name);
    assert.deepEqual(pl.questions.map((q) => q.kind), want.questions ?? [], name);
    assert.equal(pl.skipped.length, want.skipped ?? 0, name + " (skipped: " + pl.skipped.join("; ") + ")");
  }
});
test("plan: apply and send never both for one branch; two projects keep their order; labels name project and branch", () => {
  const pl = plan([facts({ project: "a", units: [{ rel: ".", branch: "main", dirty: 0, unpushed: 1 }], waiting: [w("main", "laptop")] }), facts({ project: "b", units: [{ rel: ".", branch: "x", dirty: 1, unpushed: 0 }] })], "desk");
  assert.deepEqual(pl.actions.map((a) => a.id), ["apply:a:main", "send:b:x"]);
  assert.ok(pl.actions[0].label.includes("a") && pl.actions[0].hint.includes("laptop") && pl.actions[1].hint.includes("1 change"));
  const q = plan([facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }], waiting: [w("main", "laptop")] })], "desk").questions[0];
  assert.ok(q.why.includes("laptop") && q.project === "p" && q.branch === "main");
});
test("plan: a question names the dirty unit and whether it is on the waiting branch (only then can local be sent over the handoff)", () => {
  const same = plan([facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }], waiting: [w("main", "laptop")] })], "desk").questions[0];
  assert.deepEqual([same.unit, same.sameBranch, same.when], [".", true, "2026-09-16T08:00:00+00:00"]);
  const other = plan([facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }], waiting: [w("feat", "laptop")] })], "desk").questions[0];
  assert.deepEqual([other.unit, other.sameBranch], [".", false]);
  const wt = plan([facts({ layout: "worktrees", units: [{ rel: "wt-b", branch: "b", dirty: 2, unpushed: 0 }], waiting: [w("b", "laptop")] })], "desk").questions[0];
  assert.deepEqual([wt.unit, wt.sameBranch], ["wt-b", true]);
});
