import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeLayers, diffKeys } from "../src/jsonmerge.ts";
import { parseManifest, validate, selected, identityForUrl, projectBlock, globs, globMatch, hasRemote } from "../src/manifest.ts";
import { canonicalGithub } from "../src/git.ts";
import { parseRepoUrl } from "../src/master.ts";
import { envVarName } from "../src/adopt.ts";
import { parseDotenv, dumpDotenv } from "../src/secrets/index.ts";

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
test("master: repo url parsing", () => {
  for (const u of ["https://github.com/o/r", "https://github.com/o/r.git", "https://github.com/o/r/", "github.com/o/r", "git@github.com:o/r", "ssh://git@github.com/o/r.git", "https://www.github.com/o/r"]) assert.deepEqual(parseRepoUrl(u), ["git@github.com:o/r.git", ["o", "r"]], u);
  assert.deepEqual(parseRepoUrl("git@gitea.local:me/cfg.git"), ["git@gitea.local:me/cfg.git", undefined]);
});
test("adopt: env var names; dotenv round trip", () => {
  assert.equal(envVarName("coolify-teido", "COOLIFY_BASE_URL"), "COOLIFY_TEIDO_BASE_URL");
  assert.equal(envVarName("coolify", "COOLIFY_ACCESS_TOKEN"), "COOLIFY_ACCESS_TOKEN");
  const v = { A: "1", B: "with space", C: "q\"uote" };
  assert.deepEqual(parseDotenv(dumpDotenv(v)), v);
});
