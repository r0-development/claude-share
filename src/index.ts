/** cs — command tree (commander). One subcommand → one module. */
import { Command } from "commander";
import { existsSync, unlinkSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as ui from "./ui.js";
import * as platform from "./platform.js";
import { loadMachine, machineExists, repoDir, type Machine } from "./config.js";
import { identityByFlag, loadManifest, projectForPath, type Manifest } from "./manifest.js";
import { csConfigDir, toolRoot } from "./paths.js";
import * as git from "./git.js";

const pkg = JSON.parse((await import("node:fs")).readFileSync(join(toolRoot(), "package.json"), "utf8")) as { version: string };
const csv = (s?: string) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);
function ctx(): { repo: string; m: Machine; man: Manifest } { const m = loadMachine(); const repo = repoDir(m); return { repo, m, man: loadManifest(repo) }; }

const program = new Command("cs").description("claude-share: projects + Claude Code setup in sync across machines").version(pkg.version, "-V, --version")
  .option("-q, --quiet", "only warnings/errors").configureHelp({ sortSubcommands: false }).showSuggestionAfterError(true).enablePositionalOptions()
  .addHelpText("after", `
examples:
  cs init                                  set this machine up (wizard: join or create a share)
  cs new billing-api --personal            new project: dir, git, GitHub repo, first push, Claude wired in
  cs                                       dashboard: config repo + every project
  cs sync                                  push/pull the config repo (memory, plans, settings)
  cs identity add acme --owner acme-org --name "Me" --email me@acme.com
  cs secrets set global API_TOKEN=…        encrypted, available to Claude's MCP servers as \${API_TOKEN}`);
program.hook("preAction", (_root, cmd) => ui.setQuiet(Boolean(program.opts().quiet || (cmd.opts() as any).quiet)));

program.command("init").description("set this machine up (wizard) — or --repo <url> / --owner <owner> for scripts")
  .option("--repo <url>", "existing config repo: git URL or local path").option("--owner <owner>", "GitHub user/org to create claude-share-config under")
  .option("--key <path>", "ssh key for cloning --repo (instead of the master key)").option("--non-interactive").option("--name <name>", "machine name")
  .option("--profiles <list>", "comma list").option("--workspace <path>").option("--skip <phases>", "comma list: deps,repo,ssh,apply,link,secrets,hooks,doctor").option("--install-deps")
  .action(async (o) => { const { init } = await import("./init.js"); process.exitCode = await init({ repo: o.repo, owner: o.owner, key: o.key, name: o.name, profiles: csv(o.profiles), workspace: o.workspace, skip: csv(o.skip), installDeps: o.installDeps, interactive: !o.nonInteractive && (ui.isTTY() || ui.isScripted()) }); });

const config = program.command("config").description("manage the config repo");
config.command("new <path>").description("create a config repo skeleton").action(async (p) => { const { newConfigRepo } = await import("./init.js"); const { expand, contract } = await import("./paths.js"); const d = newConfigRepo(expand(p)); ui.ok(`config repo created at ${contract(d)} — edit projects.toml, then cs init --repo ${contract(d)}`); });
config.command("path").description("print the config repo path").action(() => console.log(repoDir(loadMachine())));

program.command("apply").description("render ~/.claude + git identity includes from the config repo").option("--check", "report drift, change nothing")
  .action(async (o) => { const { repo, m, man } = ctx(); const { runApply } = await import("./apply.js");
    await ui.command(o.check ? "cs apply --check" : "cs apply", async () => { const n = (await ui.group(o.check ? "drift" : "~/.claude applied", () => runApply(repo, m, man, o.check), { done: o.check ? "no drift" : "already up to date" })).length; process.exitCode = o.check && n ? 1 : 0; }); });
program.command("link [names...]").description("sync Claude files between side-store and project checkouts").option("--check")
  .action(async (names, o) => { const { repo, m, man } = ctx(); const { runLink } = await import("./link.js");
    await ui.command(o.check ? "cs link --check" : "cs link", async () => { const n = await ui.group(o.check ? "pending changes" : "project files linked", () => runLink(repo, m, man, names, o.check), { done: o.check ? "nothing pending" : "already in sync" }); process.exitCode = o.check && n ? 1 : 0; }); });
program.command("adopt <what> [names...]").description("pull existing local state into the config repo (memory | project | mcp)").option("--all").option("--check").option("--show", "(mcp) print the secret values")
  .action(async (what, names, o) => { const { repo, m, man } = ctx(); const { runAdopt } = await import("./adopt.js"); const { selectedProjects } = await import("./manifest.js");
    const targets = names.length ? names : o.all ? selectedProjects(man, m).map((p) => p.name) : [];
    if (o.show) { runAdopt(repo, m, man, what, targets, o.check, true); return; }
    await ui.command(`cs adopt ${what}`, async () => { for (const n of targets) await ui.group(n, () => runAdopt(repo, m, man, what, [n], o.check, false), { done: "nothing to adopt" }); }); });
program.command("sync").description("commit / pull --rebase / push the config repo (+ synced projects)").option("--pull-only").option("--push-only").option("--timeout <s>", "", "20").option("--resolve <ours|theirs>").option("--no-projects").option("--debounce <s>", "skip if a sync ran less than N seconds ago", "0").option("-q, --quiet")
  .action(async (o) => { const { repo, m, man } = ctx(); const { runSync } = await import("./sync.js"); const opts = { pullOnly: o.pullOnly, pushOnly: o.pushOnly, timeout: +o.timeout, resolve: o.resolve, projects: o.projects, debounce: +o.debounce };
    if (o.quiet || program.opts().quiet) { process.exitCode = await runSync(repo, m, man, opts); return; }
    await ui.command("cs sync", async () => { process.exitCode = await runSync(repo, m, man, opts); }, { outro: () => (process.exitCode ? ui.red("blocked — see above") : ui.dim("in sync")) }); });
program.command("status").description("config repo + projects overview").option("--fetch").option("--all").action(async (o) => { const { repo, m, man } = ctx(); const { runStatus } = await import("./status.js"); ui.intro(`cs status  ${ui.dim(m.name)}`); process.exitCode = await runStatus(repo, m, man, o.fetch, o.all); ui.outro(ui.dim("cs sync · cs clone · cs doctor")); });
program.command("doctor").description("environment and consistency checks").option("--fix").action(async (o) => { const { repo, m, man } = ctx(); const { runDoctor } = await import("./doctor.js"); ui.intro("cs doctor"); process.exitCode = runDoctor(repo, m, man, o.fix); ui.outro(process.exitCode ? ui.red("problems found") : ui.green("all good")); });
program.command("add [path]").description("register a project (default: cwd) in projects.toml").option("--kind <kind>").option("--profiles <list>").option("--identity <id>").option("--name <name>").option("--description <text>", "", "").option("--no-commit")
  .action(async (p, o) => { const { repo, m, man } = ctx(); const { add } = await import("./projects.js"); add(repo, m, man, p, { kind: o.kind, profiles: csv(o.profiles), identity: o.identity, name: o.name, description: o.description, noCommit: !o.commit }); });
program.command("clone [names...]").description("clone selected projects that are missing on this machine").option("--dry-run").action(async (names, o) => { const { repo, m, man } = ctx(); const { clone } = await import("./projects.js");
  await ui.command("cs clone", async () => { process.exitCode = await ui.group(o.dryRun ? "would clone" : "cloned", () => clone(repo, m, man, names, o.dryRun), { done: "nothing missing" }); }); });
program.command("new <name>").description("create a brand-new project: dir, git, GitHub repo, first push, register, link")
  .option("--identity <id>", "identity id (or --<id> / --<github-owner>, e.g. --personal)").option("--profiles <list>").option("-d, --description <text>", "", "").option("--public").option("--no-github").option("--synced")
  .action(async (name, o) => { const { repo, m, man } = ctx(); let id = o.identity;
    if (!id) throw new Error(`cs: which identity? use one of ${Object.keys(man.identities).map((i) => "--" + i).join(", ")} (or --identity <id>)`);
    const ident = man.identities[id] ?? identityByFlag(man, id); if (!ident) throw new Error(`cs: unknown identity '${id}'`);
    const profiles = csv(o.profiles).length ? csv(o.profiles) : m.profiles.includes(ident.id) ? [ident.id] : [...m.profiles];
    const { create } = await import("./projects.js"); process.exitCode = await create(repo, m, man, name, ident, { profiles, description: o.description, priv: !o.public, noGithub: !o.github, kind: o.synced ? "synced" : "git" }); });

const token = program.command("token").description("GitHub API tokens per owner (local, never synced)");
token.command("set <owner>").action(async (o) => { const gh = await import("./github.js"); const f = await gh.setToken(o); ui.ok(`token stored in ${(await import("./paths.js")).contract(f)} (0600, not synced)`); });
token.command("check <owner>").action(async (o) => { const gh = await import("./github.js"); const t = gh.getToken(o); if (!t) { ui.fail(`no token for '${o}'`); process.exitCode = 1; return; } try { const who = await ui.spin(`checking token for ${o}…`, async () => gh.whoami(t)); ui.ok(`token for '${o}' authenticates as ${who}`); } catch (e: any) { ui.fail(e.message); process.exitCode = 1; } });
token.command("rm <owner>").action(async (o) => { (await import("./github.js")).rmToken(o); ui.ok("removed"); });
token.command("ls").action(() => { const d = join(csConfigDir(), "tokens"); if (existsSync(d)) for (const f of readdirSync(d)) console.log(f); });

const ident = program.command("identity").description("git identities (who commits, which key, which GitHub owner)");
ident.command("ls", { isDefault: true }).description("list identities").action(async () => { const { man } = ctx(); (await import("./identity.js")).ls(man); });
ident.command("add <id>").requiredOption("--owner <owner>", "GitHub user or org").requiredOption("--name <name>").requiredOption("--email <email>").option("--key <path>").option("--no-token")
  .action(async (id, o) => { const { repo, m, man } = ctx(); process.exitCode = await (await import("./identity.js")).add(repo, m, man, id, { owner: o.owner, name: o.name, email: o.email, key: o.key, noToken: !o.token }); });
ident.command("rename <old> <new>").action(async (a, b) => { const { repo, m, man } = ctx(); process.exitCode = (await import("./identity.js")).rename(repo, m, man, a, b); });

program.command("ssh [action]").description("per-machine SSH keys: setup | check | master").action(async (action = "check") => { const { repo, m, man } = ctx();
  await ui.command(`cs ssh ${action}`, async () => { if (action === "master") process.exitCode = await (await import("./master.js")).setup(repo, ui.isTTY()); else process.exitCode = await (await import("./ssh.js")).setup(repo, m, man, action === "check"); },
    { outro: () => (process.exitCode ? ui.yellow("keys still to register — re-run cs ssh check afterwards") : ui.green("all keys verified")) }); });
program.command("deps").description("check (or install) prerequisites").option("--install").action(async (o) => { await ui.command(o.install ? "cs deps --install" : "cs deps", async () => { process.exitCode = await (await import("./deps.js")).runDeps(o.install); }, { outro: () => (process.exitCode ? ui.red("required tools missing") : ui.green("all required tools present")) }); });
program.command("hooks [action]").description("automatic sync: install | remove | status").option("--no-timer").action(async (action = "status", o) => { const { repo, m } = ctx(); const { runHooks } = await import("./hooks.js");
  if (action === "status") { ui.intro("cs hooks"); process.exitCode = runHooks(repo, m, action, o.timer); ui.outro(ui.dim("cs hooks install · cs hooks remove")); return; }
  await ui.command(`cs hooks ${action}`, async () => { process.exitCode = await ui.group(action === "remove" ? "removed" : "installed", () => runHooks(repo, m, action, o.timer)); }); });
program.command("self-update").description("update the cs tool itself").action(async () => { await ui.command("cs self-update", async () => {
  const root = toolRoot(); if (!git.isRepo(root)) throw new Error(`cs: ${root} is not a git checkout`);
  const before = git.out(["rev-parse", "--short", "HEAD"], root);
  const r = await ui.spin("checking for updates…", () => git.gitA(["pull", "-q", "--ff-only"], root, { check: false, timeout: 60 }));
  if (r.code !== 0) throw new Error(`cs: update failed\n${r.err}`);
  const after = git.out(["rev-parse", "--short", "HEAD"], root);
  if (before === after) ui.ok(`already up to date  ${ui.dim(`(${after})`)}`); else { const n = git.out(["rev-list", "--count", `${before}..${after}`], root); ui.ok(`updated ${before} → ${after}  ${ui.dim(`${n} commit(s)`)}`); for (const l of git.out(["log", "--format=%s", `${before}..${after}`], root).split("\n").slice(0, 8)) ui.info(ui.dim("• " + l)); }
  }, { outro: () => ui.dim(`cs ${pkg.version}`) }); });

const sec = program.command("secrets").description("encrypted secrets in the config repo (sops + age)").enablePositionalOptions();
const S = () => import("./secretscmd.js");
sec.command("init").action(async () => { const { repo, m } = ctx(); await ui.command("cs secrets init", async () => ui.group("secrets", async () => (await S()).init(repo, m, ui.isTTY()))); });
sec.command("status").action(async () => { const { repo, m } = ctx(); ui.intro("cs secrets status"); await (await S()).status(repo, m); ui.outro(ui.dim("cs secrets set · cs enroll <machine>")); });
sec.command("edit <name>").description("global | <project>").action(async (n) => { const { repo, m } = ctx(); await (await S()).edit(repo, m, n); });
sec.command("set <name> <pairs...>").description("KEY=VALUE …").action(async (n, pairs) => { const { repo, m } = ctx(); await (await S()).setValues(repo, m, n, pairs); });
sec.command("unset <name> <keys...>").action(async (n, keys) => { const { repo, m } = ctx(); await (await S()).unsetValues(repo, m, n, keys); });
sec.command("get <name> [key]").option("--show").action(async (n, k, o) => { const { repo, m } = ctx(); process.exitCode = await (await S()).get(repo, m, n, k, o.show); });
sec.command("pull <project>").option("--force").action(async (p, o) => { const { repo, m, man } = ctx(); process.exitCode = await (await S()).pull(repo, m, man, p, o.force); });
sec.command("push <project>").action(async (p) => { const { repo, m, man } = ctx(); process.exitCode = await (await S()).push(repo, m, man, p); });
sec.command("diff <project>").action(async (p) => { const { repo, m, man } = ctx(); process.exitCode = await (await S()).diff(repo, m, man, p); });
sec.command("exec [command...]").description("run a command with global + project secrets in its environment").option("-p, --project <name>").passThroughOptions().allowUnknownOption()
  .action(async (command, o) => { const { repo, m, man } = ctx(); const cmd = command[0] === "--" ? command.slice(1) : command; process.exitCode = await (await S()).exec(repo, m, man, o.project, cmd); });
sec.command("recovery").action(async () => { const { repo, m } = ctx(); await ui.command("cs secrets recovery", async () => (await S()).recovery(repo, m)); });
program.command("enroll <machine>").description("grant another machine access to secrets").action(async (mc) => { const { repo, m } = ctx(); await ui.command(`cs enroll ${mc}`, async () => ui.group("enrolled", async () => (await S()).enroll(repo, m, mc)), { outro: () => ui.dim(`now: cs sync here, then cs sync on ${mc}`) }); });
program.command("revoke <machine>").description("remove a machine's access to secrets").action(async (mc) => { const { repo, m } = ctx(); await ui.command(`cs revoke ${mc}`, async () => ui.group("revoked", async () => (await S()).revoke(repo, m, mc))); });
program.command("ui-demo", { hidden: true }).description("show every UI element with fake data").action(async () => {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  await ui.command("cs ui-demo", async () => {
    await ui.spin("a 2-second spinner (must animate)…", () => sleep(2000));
    await ui.group("grouped phase with items", async () => { for (const n of ["alpha", "beta", "gamma"]) { await ui.spin(`working on ${n}…`, () => sleep(600)); ui.step(`${n} done`); } });
    await ui.group("empty phase", () => {}, { done: "nothing to do" });
    ui.table([[ui.green("✓"), "node", ui.dim("v22")], [ui.yellow("!"), "gh", ui.dim("missing")]]);
    ui.note([`title  ${ui.bold("cs:demo:master")}`, `key    ${ui.bold("ssh-ed25519 AAAA… cs:demo:master")}`], "a note box");
    ui.warn("a warning"); ui.fail("an error line (does not abort)");
    if (ui.isTTY()) { const v = await ui.select("a select", [{ value: "a", label: "Option A", hint: "hint" }, { value: "b", label: "Option B" }]); const ok = await ui.confirm(`you picked ${v} — confirm?`, true); ui.step(`confirm → ${ok}`); }
  }, { outro: () => ui.dim("demo over") });
});

const proj = program.command("project").description("project helpers");
proj.command("id").description("print the project name for the cwd").action(() => { const { m, man } = ctx(); const p = projectForPath(man, m, process.cwd()); if (p) console.log(p.name); else process.exitCode = 1; });

async function main() {
  platform.refuseUnsupported();
  process.stdout.on("error", (e: any) => { if (e?.code === "EPIPE") process.exit(0); throw e; });
  const argv = process.argv.slice(2);
  // `cs new foo --personal` → `--identity personal` (identity id or GitHub owner)
  if (argv[0] === "new" && machineExists()) { try { const { man } = ctx(); for (let i = 1; i < argv.length; i++) { const a = argv[i]; if (a.startsWith("--") && !a.includes("=")) { const hit = identityByFlag(man, a.slice(2)); if (hit) argv.splice(i, 1, "--identity", hit.id); } } process.argv = [...process.argv.slice(0, 2), ...argv]; } catch {} }
  if (!argv.length) { if (machineExists()) { const { repo, m, man } = ctx(); const { runStatus } = await import("./status.js"); ui.intro(`claude-share  ${ui.dim(m.name)}`); await runStatus(repo, m, man); ui.outro(ui.dim("cs sync · cs new <project> --<identity> · cs --help")); return; } program.help(); }
  try { await program.parseAsync(process.argv); }
  catch (e: any) { if (e?.handled) { process.exitCode = e.code ?? 1; return; } const msg: string = e?.message ?? String(e); if (msg.startsWith("cs: ")) { const [what, ...rest] = msg.slice(4).split("\n"); ui.error(what, rest.join("\n").trim()); process.exitCode = 1; } else throw e; }
}
main();
