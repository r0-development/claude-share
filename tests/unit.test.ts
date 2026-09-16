import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeLayers, diffKeys } from "../src/jsonmerge.ts";
import { parseManifest, validate, selected, identityForUrl, projectBlock, globs, globMatch, hasRemote } from "../src/manifest.ts";
import { canonicalGithub } from "../src/git.ts";
import { parseRepoUrl } from "../src/sharekey.ts";
import { envVarName } from "../src/import.ts";
import { parseDotenv, dumpDotenv } from "../src/secrets/index.ts";
import { plan, status, type Facts } from "../src/plan.ts";
import { digest, gitNote } from "../src/note.ts";
import { classify, storeName, fileOf, merge3, mergeKeys, patchDotenv, describeMerge, describeKeys, blank } from "../src/env.ts";

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
const w = (branch: string, machine: string) => ({ branch, machine, when: "2026-09-16T08:00:00+00:00", note: "", ref: `handoff/u/${branch}` });
test("plan: table of facts → actions", () => {
  const cases: [string, Facts, { actions: string[]; checked?: boolean[]; questions?: string[]; skipped?: number }][] = [
    ["clean, nothing waiting", facts({}), { actions: [] }],
    ["dirty → send, checked", facts({ units: [{ rel: ".", branch: "main", dirty: 3, unpushed: 0 }] }), { actions: ["send:p:main"], checked: [true] }],
    ["unpushed commits only → send (the handoff carries them) + push of the real branch, unchecked", facts({ units: [{ rel: ".", branch: "main", dirty: 0, unpushed: 2 }] }), { actions: ["send:p:main", "push:p:main"], checked: [true, false] }],
    ["dirty + unpushed → send checked, push unchecked", facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 1 }] }), { actions: ["send:p:main", "push:p:main"], checked: [true, false] }],
    ["unpushed + waiting for the same branch → apply, and the push is still offered (never sent)", facts({ units: [{ rel: ".", branch: "main", dirty: 0, unpushed: 1 }], waiting: [w("main", "laptop")] }), { actions: ["apply:p:main", "push:p:main"], checked: [true, false] }],
    ["unpushed + dirty + waiting → question, push still offered", facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 1 }], waiting: [w("main", "laptop")] }), { actions: ["push:p:main"], checked: [false], questions: ["dirty-vs-waiting"] }],
    ["unpushed but files look secret → handoff refused, push still offered", facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 1, secrets: ["api.key"] }] }), { actions: ["push:p:main"], checked: [false], skipped: 1 }],
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
  assert.deepEqual(pl.actions.map((a) => a.id), ["apply:a:main", "push:a:main", "send:b:x"]);
  assert.ok(pl.actions[0].label.includes("a") && pl.actions[0].hint.includes("laptop") && pl.actions[2].hint.includes("1 change"));
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
test("plan: a push row names the branch and the count, is never checked, and is not offered for a unit that is skipped or unreachable", () => {
  const pu = plan([facts({ units: [{ rel: ".", branch: "feat/x", dirty: 0, unpushed: 3 }] })], "desk").actions.find((a) => a.kind === "push")!;
  assert.deepEqual([pu.id, pu.project, pu.branch, pu.checked], ["push:p:feat/x", "p", "feat/x", false]);
  assert.ok(pu.label.includes("feat/x") && pu.hint.includes("3 unpushed commits"));
  const wt = plan([facts({ layout: "worktrees", units: [{ rel: ".", branch: "main", dirty: 0, unpushed: 0 }, { rel: "wt-a", branch: "a", dirty: 0, unpushed: 1 }] })], "desk");
  assert.deepEqual(wt.actions.map((a) => a.id), ["send:p:a", "push:p:a"]);
  assert.equal(plan([facts({ units: [{ rel: ".", branch: "", dirty: 0, unpushed: 2, skip: "detached HEAD" }] })], "desk").actions.length, 0);
  assert.equal(plan([facts({ offline: true, units: [{ rel: ".", branch: "main", dirty: 0, unpushed: 2 }] })], "desk").actions.length, 0);
});

// bare cs: the same facts → one line's worth of bits and whether cs sync has anything to do
test("status: facts → bits and pending", () => {
  const cases: [string, Facts, string[], boolean][] = [
    ["clean", facts({}), [], false],
    ["dirty", facts({ units: [{ rel: ".", branch: "main", dirty: 3, unpushed: 0 }] }), ["3 dirty"], true],
    ["unpushed", facts({ units: [{ rel: ".", branch: "main", dirty: 0, unpushed: 2 }] }), ["↑2 unpushed"], true],
    ["waiting from another machine, same branch", facts({ waiting: [w("main", "laptop")] }), ["handoff waiting from laptop (2026-09-16 08:00)"], true],
    ["waiting for another branch names it", facts({ waiting: [w("feat", "laptop")] }), ["handoff waiting from laptop for feat (2026-09-16 08:00)"], true],
    ["my own handoff waiting → comes back with cs sync", facts({ waiting: [w("main", "desk")] }), ["handoff waiting from desk (2026-09-16 08:00)"], true],
    ["dirty + waiting → both shown, pending (a question for cs sync)", facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }], waiting: [w("main", "laptop")] }), ["1 dirty", "handoff waiting from laptop (2026-09-16 08:00)"], true],
    ["offline + dirty: the work is stale here whatever the network says", facts({ offline: true, units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }] }), ["1 dirty", "offline"], true],
    ["offline + clean: nothing known to be pending", facts({ offline: true }), ["offline"], false],
    ["handoff disabled: shown, dirty is not cs sync's business", facts({ disabled: true, units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }] }), ["1 dirty", "handoff disabled"], false],
    ["files that look secret: the refusal and its override, not pending", facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0, secrets: [".env.example"] }] }), ["1 dirty", "not sent — files that look secret: .env.example (cs handoff --allow <glob>)"], false],
    ["detached with work: the reason and what to do, not pending", facts({ units: [{ rel: ".", branch: "", dirty: 1, unpushed: 0, skip: "detached HEAD" }] }), ["1 dirty", "detached HEAD — not carried by cs sync: check a branch out"], false],
    ["detached and clean: just the reason", facts({ units: [{ rel: ".", branch: "", dirty: 0, unpushed: 0, skip: "detached HEAD" }] }), ["detached HEAD"], false],
    ["worktrees: other units are prefixed by their directory", facts({ layout: "worktrees", units: [{ rel: ".", branch: "main", dirty: 0, unpushed: 0 }, { rel: "wt-a", branch: "a", dirty: 2, unpushed: 1 }] }), ["wt-a: 2 dirty", "wt-a: ↑1 unpushed"], true],
  ];
  for (const [name, f, bits, pending] of cases) {
    const st = status(f, "desk");
    assert.deepEqual(st.bits.map((b) => b.text), bits, name);
    assert.equal(st.pending, pending, name + " (pending)");
  }
  assert.equal(status(facts({ units: [{ rel: ".", branch: "main", dirty: 3, unpushed: 0 }] }), "desk").bits[0].kind, "dirty");
  assert.equal(status(facts({ offline: true }), "desk").bits[0].kind, "offline");
  // stuck: work is here that cs sync will not carry — attention, even though nothing is pending
  assert.equal(status(facts({ units: [{ rel: ".", branch: "", dirty: 1, unpushed: 0, skip: "detached HEAD" }] }), "desk").stuck, true);
  assert.equal(status(facts({ units: [{ rel: ".", branch: "", dirty: 0, unpushed: 0, skip: "detached HEAD" }] }), "desk").stuck, false);
  assert.equal(status(facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0, secrets: [".env.example"] }] }), "desk").stuck, true);
  assert.equal(status(facts({ disabled: true, units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }] }), "desk").stuck, false);
});

// .env files on the plan screen: one row per file with something to move (checked), one question per key changed on both sides
const env = (over: Partial<Facts["env"] extends (infer E)[] | undefined ? E : never>) => ({ file: ".env", kind: "values" as const, merge: { result: {}, toLocal: [], toStore: [], conflicts: [] }, ...over });
test("plan: .env rows and per-key questions; unignored files are skipped with the fix; nothing to move → no row", () => {
  const store = plan([facts({ env: [env({ merge: { result: { A: "1", B: "2" }, toLocal: [], toStore: ["A", "B"], conflicts: [] } })] })], "desk");
  assert.deepEqual(store.actions.map((a) => [a.id, a.kind, a.checked, a.label, a.hint]), [["env:p:.env", "env", true, "p · .env", "store 2 keys"]]);
  const take = plan([facts({ env: [env({ file: ".env.production", from: "laptop", merge: { result: { A: "1" }, toLocal: ["A"], toStore: [], conflicts: [] } })] })], "desk");
  assert.deepEqual(take.actions.map((a) => [a.id, a.hint]), [["env:p:.env.production", "take 1 key from laptop"]]);
  const both = plan([facts({ env: [env({ from: "laptop", merge: { result: { B: "2" }, toLocal: ["B"], toStore: [], conflicts: [{ key: "A", local: "x", stored: "y" }, { key: "C", local: "1", stored: undefined }] } })] })], "desk");
  assert.deepEqual(both.actions.map((a) => a.id), ["env:p:.env"]);
  assert.deepEqual(both.questions.map((q) => q.kind === "env-key" ? [q.project, q.file, q.key] : q.kind), [["p", ".env", "A"], ["p", ".env", "C"]]);
  assert.ok(both.questions[0].why.includes("A") && both.questions[0].why.includes("laptop"), both.questions[0].why);
  assert.equal(plan([facts({ env: [env({})] })], "desk").actions.length, 0);
  const un = plan([facts({ env: [env({ kind: "unignored" })] })], "desk");
  assert.equal(un.actions.length, 0); assert.ok(un.skipped[0].includes(".env") && un.skipped[0].includes(".gitignore"), un.skipped[0]);
  // the share carries .env files, not the project remote: offline or handoff-disabled projects still get their row
  assert.deepEqual(plan([facts({ offline: true, env: [env({ merge: { result: { A: "1" }, toLocal: [], toStore: ["A"], conflicts: [] } })] })], "desk").actions.map((a) => a.id), ["env:p:.env"]);
  assert.deepEqual(plan([facts({ disabled: true, env: [env({ merge: { result: { A: "1" }, toLocal: [], toStore: ["A"], conflicts: [] } })] })], "desk").actions.map((a) => a.id), ["env:p:.env"]);
  // rows keep the project's order: env after the project's handoff rows
  const mixed = plan([facts({ units: [{ rel: ".", branch: "main", dirty: 1, unpushed: 0 }], env: [env({ merge: { result: { A: "1" }, toLocal: [], toStore: ["A"], conflicts: [] } })] })], "desk");
  assert.deepEqual(mixed.actions.map((a) => a.id), ["send:p:main", "env:p:.env"]);
});
test("status: .env bits — what would move is pending; an unignored file names the fix", () => {
  const st = status(facts({ env: [env({ from: "laptop", merge: { result: { A: "1" }, toLocal: ["A"], toStore: [], conflicts: [] } })] }), "desk");
  assert.deepEqual(st.bits.map((b) => [b.kind, b.text]), [["env", ".env: take 1 key from laptop"]]); assert.equal(st.pending, true);
  assert.equal(status(facts({ env: [env({})] }), "desk").bits.length, 0);
  const un = status(facts({ env: [env({ kind: "unignored" })] }), "desk");
  assert.deepEqual(un.bits.map((b) => b.kind), ["skip"]); assert.ok(un.bits[0].text.includes(".gitignore")); assert.equal(un.pending, false);
});
test("plan/status: a keys-only file (.env.local) is self-heal — no row, no question; keys arriving are pending; empty keys are named to fill in", () => {
  const local = env({ file: ".env.local", kind: "local", from: "laptop", merge: { result: { HOST: "", PORT: "3000" }, toLocal: ["HOST", "PORT"], toStore: [], conflicts: [] }, toFill: ["HOST"] });
  const pl = plan([facts({ env: [local] })], "desk");
  assert.equal(pl.actions.length, 0); assert.equal(pl.questions.length, 0); assert.equal(pl.skipped.length, 0);
  const st = status(facts({ env: [local] }), "desk");
  assert.deepEqual(st.bits.map((b) => [b.kind, b.text]), [["env", ".env.local: take 2 keys from laptop (1 to fill in)"], ["env", ".env.local: 1 key to fill in (HOST)"]]);
  assert.equal(st.pending, true);
  // nothing arriving, one key still empty: only the fill-in line, and cs sync is not the answer
  const filled = status(facts({ env: [env({ file: ".env.local", kind: "local", toFill: ["HOST"] })] }), "desk");
  assert.deepEqual(filled.bits.map((b) => b.text), [".env.local: 1 key to fill in (HOST)"]); assert.equal(filled.pending, false);
  assert.equal(status(facts({ env: [env({ file: ".env.local", kind: "local", toFill: [] })] }), "desk").bits.length, 0);
});

// handoff notes: a session transcript (jsonl) → the digest headless Claude reads; the git-derived fallback text
const line = (o: object) => JSON.stringify(o);
const jsonl = [
  line({ type: "mode", mode: "normal" }),
  line({ type: "user", isMeta: true, message: { role: "user", content: "<local-command-caveat>ignored</local-command-caveat>" } }),
  line({ type: "user", message: { role: "user", content: "implement the widget<system-reminder>\nhidden reminder\n</system-reminder>" } }),
  line({ type: "assistant", message: { role: "assistant", content: [{ type: "thinking", thinking: "private" }, { type: "text", text: "Reading the widget first." }, { type: "tool_use", name: "Bash", input: { command: "cat src/widget.ts", description: "Read widget" } }] } }),
  line({ type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "x", content: "export const widget = 1; // huge tool output" }] } }),
  line({ type: "assistant", message: { role: "assistant", content: [{ type: "tool_use", name: "Edit", input: { file_path: "src/widget.ts", old_string: "1", new_string: "2" } }, { type: "text", text: "Half wired; tests next." }] } }),
  "not json at all",
].join("\n") + "\n";
test("note: digest keeps what was said and done, drops tool output, thinking, meta lines and reminders", () => {
  const d = digest(jsonl);
  assert.ok(d.includes("USER: implement the widget") && d.includes("CLAUDE: Reading the widget first.") && d.includes("Half wired; tests next."), d);
  assert.ok(d.includes("→ Bash: cat src/widget.ts") && d.includes("→ Edit: src/widget.ts"), d);
  assert.ok(!d.includes("huge tool output") && !d.includes("private") && !d.includes("hidden reminder") && !d.includes("ignored"), d);
  assert.equal(digest(""), "");
  assert.ok(digest(line({ type: "user", message: { role: "user", content: "<div> is broken" } })).includes("USER: <div> is broken"));   // only injected forms are dropped
});
test("note: digest keeps the tail of a long session and says the start was cut", () => {
  const long = Array.from({ length: 200 }, (_, i) => line({ type: "user", message: { role: "user", content: `message number ${i} ${"x".repeat(100)}` } })).join("\n");
  const d = digest(long, 5000);
  assert.ok(d.length <= 5200 && d.startsWith("[earlier part of the session omitted]") && d.includes("message number 199") && !d.includes("message number 0 "), d.slice(0, 200));
  const one = digest(line({ type: "user", message: { role: "user", content: "y".repeat(9000) } }), 5000);   // one huge line: still cut
  assert.ok(one.length <= 5100 && one.startsWith("[earlier part"), String(one.length));
});
test("note: the git-derived fallback names branch, files, last commit, session end and why there is no summary", () => {
  const n = gitNote({ branch: "feat/x", changed: ["README", "src/a.ts"], subject: "add a", ended: "2026-09-16T12:08:00", why: "claude not on PATH" });   // no zone: local time, shown as such
  const [first, ...rest] = n.split("\n");
  assert.equal(first, 'feat/x · 2 changed files · last commit "add a" · session ended 2026-09-16 12:08');
  assert.deepEqual(rest, ["README, src/a.ts", "no summary: claude not on PATH"]);
  const many = gitNote({ branch: "main", changed: Array.from({ length: 12 }, (_, i) => `f${i}`), subject: "", why: "no session transcript" });
  assert.ok(many.startsWith("main · 12 changed files") && !many.includes("last commit") && !many.includes("session ended") && many.includes("f7, … 4 more"), many);
  assert.ok(gitNote({ branch: "main", changed: [], subject: "s", why: "x" }).startsWith('main · clean tree · last commit "s"'));
});

// .env files (ADR-0003): which files travel, and the per-key three-way merge behind "newest wins, asked when both changed"
test("env: classification by name and git status — tracked stays git's, gitignored travels, *.local is keys-only, unignored is refused", () => {
  assert.equal(classify(".env", { tracked: true, ignored: false }), "tracked");
  assert.equal(classify(".env.example", { tracked: true, ignored: false }), "tracked");
  assert.equal(classify(".env", { tracked: false, ignored: true }), "values");
  assert.equal(classify(".env.production", { tracked: false, ignored: true }), "values");
  assert.equal(classify(".env.local", { tracked: false, ignored: true }), "local");
  assert.equal(classify(".env.production.local", { tracked: false, ignored: true }), "local");
  assert.equal(classify(".env.site", { tracked: false, ignored: true }, [".env.site"]), "local");   // manifest env.local = [...]
  assert.equal(classify(".env", { tracked: false, ignored: false }), "unignored");
  assert.equal(classify(".env", { tracked: true, ignored: true }), "tracked");   // tracked wins: git has it whatever .gitignore says
});
test("env: a project's .env files map to secrets/projects entries and back", () => {
  assert.equal(storeName("web", ".env"), "web");
  assert.equal(storeName("web", ".env.production"), "web.production");
  assert.equal(fileOf("web", "web"), ".env");
  assert.equal(fileOf("web", "web.production"), ".env.production");
  assert.equal(fileOf("web", "webapp"), undefined);
  assert.equal(fileOf("web", "web.api"), ".env.api");
});
test("env: three-way merge per key — each side's change taken, unrelated keys kept, both-changed asked", () => {
  const base = { A: "1", B: "2", C: "3", D: "4" };
  const m = merge3(base, { A: "1", B: "changed here", D: "4", E: "new here" }, { A: "1", B: "2", C: "3", D: "changed there", F: "new there" });
  assert.deepEqual(m.result, { A: "1", B: "changed here", D: "changed there", E: "new here", F: "new there" });   // C removed here → gone
  assert.deepEqual(m.toStore.sort(), ["B", "C", "E"]);
  assert.deepEqual(m.toLocal.sort(), ["D", "F"]);
  assert.deepEqual(m.conflicts, []);
  // the same key changed on both sides: not decided by the merge, left out of the result until a side is chosen
  const c = merge3(base, { A: "here", B: "2", C: "3", D: "4" }, { A: "there", B: "2", C: "3", D: "4" });
  assert.deepEqual(c.conflicts.map((x) => x.key), ["A"]);
  assert.deepEqual(c.conflicts[0], { key: "A", local: "here", stored: "there" });
  assert.ok(!("A" in c.result) && c.toStore.length === 0 && c.toLocal.length === 0);
  assert.deepEqual(merge3(base, { A: "here", B: "2", C: "3", D: "4" }, { A: "there", B: "2", C: "3", D: "4" }, { A: "local" }).result.A, "here");
  assert.deepEqual(merge3(base, { A: "here", B: "2", C: "3", D: "4" }, { A: "there", B: "2", C: "3", D: "4" }, { A: "stored" }).result.A, "there");
  // removed on one side, changed on the other: also a conflict (a chosen side may mean "drop it")
  const r = merge3(base, { B: "2", C: "3", D: "4" }, { A: "there", B: "2", C: "3", D: "4" });
  assert.deepEqual(r.conflicts, [{ key: "A", local: undefined, stored: "there" }]);
  assert.ok(!("A" in merge3(base, { B: "2", C: "3", D: "4" }, { A: "there", B: "2", C: "3", D: "4" }, { A: "local" }).result));
  // both sides made the same change: no conflict, nothing to do
  assert.deepEqual(merge3(base, { ...base, A: "same" }, { ...base, A: "same" }), { result: { ...base, A: "same" }, toStore: [], toLocal: [], conflicts: [] });
});
test("env: without a snapshot (first sync) keys are united and a value differing on both sides is asked", () => {
  const m = merge3(undefined, { A: "1", B: "here" }, { A: "1", C: "there" });
  assert.deepEqual([m.result, m.toStore, m.toLocal, m.conflicts], [{ A: "1", B: "here", C: "there" }, ["B"], ["C"], []]);
  assert.deepEqual(merge3(undefined, { A: "here" }, { A: "there" }).conflicts, [{ key: "A", local: "here", stored: "there" }]);
  assert.deepEqual(merge3(undefined, { A: "1" }, {}), { result: { A: "1" }, toStore: ["A"], toLocal: [], conflicts: [] });   // nothing stored yet: the file is stored
  assert.deepEqual(merge3(undefined, {}, { A: "1" }), { result: { A: "1" }, toStore: [], toLocal: ["A"], conflicts: [] });   // nothing here yet: the file is pulled
});
test("env: the local file is patched in place — comments, order and quoting style survive; new keys are appended, removed keys dropped", () => {
  const text = "# db\nDB=pg\nexport TOKEN='abc'\n\nURL=\"https://x\"\nGONE=1\n";
  const out = patchDotenv(text, { DB: "mysql", TOKEN: "abc", URL: "https://x", NEW: "with space" });
  assert.equal(out, "# db\nDB=mysql\nexport TOKEN='abc'\n\nURL=\"https://x\"\nNEW=\"with space\"\n");
  assert.equal(patchDotenv("", { A: "1" }), "A=1\n");
  assert.equal(patchDotenv("A=1", { A: "1", B: "2" }), "A=1\nB=2\n");   // a missing final newline is added before appending
  assert.deepEqual(parseDotenv(patchDotenv(text, { DB: "a b", TOKEN: "t'q" })), { DB: "a b", TOKEN: "t'q" });   // patched values always parse back
});
test("env: keys-only merge — keys travel, values never: a new key arrives with the .env.example default or empty, an existing value is untouched, a removed key leaves", () => {
  const example = { DB: "postgres://localhost/db", PORT: "3000" };
  // first sync here: the share lists KEY and PORT, this machine has HOST with its own value
  const m = mergeKeys(undefined, { HOST: "10.0.0.2" }, ["KEY", "PORT"], example);
  assert.deepEqual(m.result, { HOST: "10.0.0.2", KEY: "", PORT: "3000" });
  assert.deepEqual([m.toLocal.sort(), m.toStore, m.conflicts], [["KEY", "PORT"], ["HOST"], []]);
  assert.deepEqual(m.toFill, ["KEY"]);
  // an existing value is never overwritten, whatever the example says
  const kept = mergeKeys(["PORT"], { PORT: "8080" }, ["PORT"], example);
  assert.deepEqual([kept.result, kept.toLocal, kept.toStore], [{ PORT: "8080" }, [], []]);
  // the same key on both sides with different values here vs there is never a conflict: values do not travel
  assert.deepEqual(mergeKeys(undefined, { A: "here" }, ["A"], {}).conflicts, []);
  // removed on one machine since the last sync → removed everywhere (the set of keys must not drift); the line goes, the value with it
  const rm = mergeKeys(["A", "B"], { A: "1", B: "2" }, ["A"], {});
  assert.deepEqual([rm.result, rm.toLocal, rm.toStore], [{ A: "1" }, ["B"], []]);
  const rmHere = mergeKeys(["A", "B"], { A: "1" }, ["A", "B"], {});
  assert.deepEqual([rmHere.result, rmHere.toLocal, rmHere.toStore], [{ A: "1" }, [], ["B"]]);
  // a key that is empty here stays listed as to fill in
  assert.deepEqual(mergeKeys(["A"], { A: "" }, ["A"], {}).toFill, ["A"]);
  assert.deepEqual(blank({ A: "1", B: "" }), { A: "", B: "" });
});
test("env: an empty value is written as KEY= (to fill in), never KEY=\"\"", () => {
  assert.equal(patchDotenv("A=1\n", { A: "1", KEY: "" }), "A=1\nKEY=\n");
  assert.equal(patchDotenv("KEY=old\n", { KEY: "" }), "KEY=\n");
  assert.deepEqual(parseDotenv("KEY=\n"), { KEY: "" });
});
test("env: the keys-only hint counts keys, names the machine, and says how many are still to fill in", () => {
  const mk = (over: Partial<ReturnType<typeof mergeKeys>>) => ({ result: {}, toStore: [], toLocal: [], conflicts: [], toFill: [], ...over });
  assert.equal(describeKeys(mk({ result: { A: "", B: "3000" }, toLocal: ["A", "B"], toFill: ["A"] }), "laptop"), "take 2 keys from laptop (1 to fill in)");
  assert.equal(describeKeys(mk({ result: { A: "x" }, toLocal: ["A"] }), "laptop"), "take 1 key from laptop");
  assert.equal(describeKeys(mk({ result: { A: "x" }, toStore: ["A"] })), "store 1 key");
  assert.equal(describeKeys(mk({ result: {}, toLocal: ["A"] })), "drop 1 key here");
  assert.equal(describeKeys(mk({ result: { A: "" }, toFill: ["A"] })), "");   // nothing moves: the fill-in line is the status bit's job
});
test("env: the plan-screen hint says what moves, where from, and when a key is dropped", () => {
  const mk = (over: Partial<ReturnType<typeof merge3>>) => ({ result: {}, toStore: [], toLocal: [], conflicts: [], ...over });
  assert.equal(describeMerge(mk({ result: { A: "1", B: "2" }, toStore: ["A", "B"] })), "store 2 keys");
  assert.equal(describeMerge(mk({ result: { A: "1" }, toLocal: ["A"] }), "laptop"), "take 1 key from laptop");
  assert.equal(describeMerge(mk({ result: { A: "1", B: "2" }, toStore: ["A"], toLocal: ["B"], conflicts: [{ key: "C", local: "1", stored: "2" }] }), "laptop"), "store 1 key, take 1 key from laptop, 1 key changed on both machines — asked next");
  assert.equal(describeMerge(mk({ result: {}, toStore: ["A"] })), "drop 1 key from the share");   // the file was deleted here
  assert.equal(describeMerge(mk({ result: { A: "1" }, toLocal: ["A", "B"] }), "laptop"), "take 1 key from laptop, drop 1 key here");
});

// ---------------------------------------------------------------- docs: the README and docs/ follow the glossary and the command tree
import { readFileSync, readdirSync } from "node:fs";
const DOCS = ["README.md", ...readdirSync("docs").filter((f) => f.endsWith(".md")).map((f) => `docs/${f}`), ...readdirSync("docs/adr").map((f) => `docs/adr/${f}`)];
const read = (f: string) => readFileSync(f, "utf8");
const CODE = /```[\s\S]*?```|`[^`\n]*`/g;   // fenced blocks and code spans: literal names (commands, flags, files, refs)
const prose = (md: string) => md.replace(CODE, "");
const code = (md: string) => [...md.matchAll(CODE)].map((m) => m[0]).join("\n");
const INDEX = read("src/index.ts");
test("docs: no avoided glossary term in any doc (CONTEXT.md _Avoid_ lists; literal names in code spans excepted)", () => {
  // words the glossary avoids only in one sense and that docs need in another: process environment, git push/pull, GitHub API tokens and user accounts, the verb "store", a `<user>` ref segment
  const otherSense = new Set(["env", "environment", "push", "pull", "tokens", "user", "account", "store", "group", "tag", "handoff"]);
  const avoided = [...read("CONTEXT.md").matchAll(/_Avoid_: (.*)/g)].flatMap((m) => m[1].replace(/\(.*?\)/g, "").split(",").map((t) => t.trim())).filter((t) => t && !otherSense.has(t));
  const bad: string[] = [];
  for (const f of DOCS) {
    const text = prose(read(f));
    for (const t of avoided) {
      const re = t === "repo" ? /(?<![-\w]|GitHub |git )repo\b/gi : new RegExp(`\\b${t.replace(/[-]/g, "\\-")}\\b`, "gi");   // "GitHub repo" names the remote, not the share; `--repo` is a flag
      for (const m of text.matchAll(re)) bad.push(`${f}: "${m[0]}" …${text.slice(Math.max(0, m.index! - 30), m.index! + 30).replace(/\n/g, " ")}…`);
    }
  }
  assert.deepEqual(bad, []);
});
test("docs: every documented cs command exists; the README's command table carries cs --help's descriptions", () => {
  const subs: Record<string, Set<string>> = {}; let parent = "";
  for (const m of INDEX.matchAll(/(\w+)\.command\("([a-z-]+)[^"]*"/g)) { if (m[1] === "program") { parent = m[2]; subs[parent] ??= new Set(); } else subs[parent].add(m[2]); }
  for (const m of INDEX.matchAll(/program\.command\("([a-z]+) [[<]\w+[\]>][^"]*"[^\n]*?\.description\("[^"]*[:(] ?((?:[a-z-]+ \| )+[a-z-]+)\)?"/g)) for (const a of m[2].split(" | ")) subs[m[1]].add(a);   // `[action]` / `<what>` positionals, listed as "a | b | c" (or "(a | b | c)") in the description
  const bad: string[] = [];
  for (const f of DOCS) for (const m of code(read(f)).matchAll(/\bcs ([a-z][a-z-]*)(?: ([a-z][a-z-]*))?/g)) {
    if (!(m[1] in subs)) bad.push(`${f}: cs ${m[1]}`);
    else if (m[2] && subs[m[1]].size && !subs[m[1]].has(m[2])) bad.push(`${f}: cs ${m[1]} ${m[2]}`);
  }
  assert.deepEqual(bad, []);
  const readme = read("README.md").replace(/\\([|<>])/g, "$1");
  for (const m of INDEX.matchAll(/program\.command\("([a-z-]+)[^"]*"\)\.description\("([^"]+)"\)/g)) assert.ok(readme.includes(m[2]), `README lacks cs --help's line for cs ${m[1]}: ${m[2]}`);
});
