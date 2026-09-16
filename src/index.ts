/** cs — command tree (commander). One subcommand → one module. Visible tier = what a user must know; the rest is hidden. */
import { Command, Option } from "commander";
import { existsSync, unlinkSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import * as ui from "./ui.js";
import * as platform from "./platform.js";
import { loadMachine, machineExists, shareDir, type Machine } from "./machine.js";
import { identityByFlag, loadManifest, projectForPath, type Manifest } from "./manifest.js";
import { csConfigDir, stateDir, toolRoot } from "./paths.js";
import * as git from "./git.js";

const pkg = JSON.parse(readFileSync(join(toolRoot(), "package.json"), "utf8")) as { version: string };
const csv = (s?: string) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);
function ctx(): { repo: string; m: Machine; man: Manifest } { const m = loadMachine(); const repo = shareDir(m); return { repo, m, man: loadManifest(repo) }; }
const HIDDEN = { hidden: true };

const program = new Command("cs").description("claude-share: your projects and Claude Code setup, identical on every machine").version(pkg.version, "-V, --version")
  .option("-q, --quiet", "only warnings/errors").configureHelp({ sortSubcommands: false }).showSuggestionAfterError(true).enablePositionalOptions()
  .addHelpText("after", `
daily
  cs                                       what is waiting for me, what is stale here
  cs sync                                  run when leaving and when arriving: handoffs, pushes, .env files, the share

occasionally
  cs new billing-api --personal            new project: dir, git, private GitHub repo, first push, Claude wired in
  cs add ~/dev/existing                    register a directory (creates its GitHub repo when it has none)
  cs secrets set global API_TOKEN=…        encrypted; available to Claude's MCP servers as \${API_TOKEN}
  cs trust laptop                          let another machine read the secrets

setup
  cs init                                  set this machine up (wizard: join or create a share)
  cs doctor --fix                          check everything; fix what can be fixed`);
program.hook("preAction", (_root, cmd) => ui.setQuiet(Boolean(program.opts().quiet || (cmd.opts() as any).quiet)));

// ------------------------------------------------------------------ daily
// share-sync: the share alone (commit / pull --rebase / push) — what the hooks and the timer run. `cs sync` is the daily verb on top of it.
const shareSyncAction = (title: string) => async (o: any) => { const { repo, m, man } = ctx(); const { runShareSync } = await import("./sharesync.js"); const opts = { pullOnly: o.pullOnly, pushOnly: o.pushOnly, timeout: +o.timeout, resolve: o.resolve, debounce: +o.debounce };
    if (o.quiet || program.opts().quiet) { process.exitCode = await runShareSync(repo, m, man, opts); return; }
    await ui.command(title, async () => { process.exitCode = await runShareSync(repo, m, man, opts); }, { outro: () => (process.exitCode ? ui.red("not synced — see above") : ui.dim("in sync")) }); };
const shareSyncOpts = (c: Command) => c.option("--pull-only").option("--push-only").option("--timeout <s>", "", "20").option("--resolve <ours|theirs|newest>", "how a file changed on both machines is settled (default newest)").option("--debounce <s>", "skip if a sync ran less than N seconds ago", "0").option("-q, --quiet");
program.command("sync").description("the daily verb: bring this machine up to date and leave nothing stale here")
  .option("-m, --note <text>", "note carried by the handoffs sent (shown where the work is resumed)")
  .addOption(new Option("--timeout <s>", "").default("20").hideHelp()).addOption(new Option("-q, --quiet").hideHelp())
  // hooks installed before cs sync became the daily verb call `cs sync --push-only|--pull-only`; those stay the share-only sync (ADR-0002: never a project remote unattended)
  .addOption(new Option("--pull-only").hideHelp()).addOption(new Option("--push-only").hideHelp()).addOption(new Option("--debounce <s>").default("0").hideHelp())
  .action(async (o) => { if (o.pullOnly || o.pushOnly) return shareSyncAction("cs sync")(o);
    const { repo, m, man } = ctx(); const { runSync } = await import("./sync.js");
    await ui.command(`cs sync  ${ui.dim(m.name)}`, async () => { const r = await runSync(repo, m, man, { note: o.note, timeout: +o.timeout }); process.exitCode = r.rc; return r.summary; }, { outro: (s) => s }); });
shareSyncOpts(program.command("share-sync", HIDDEN).description("commit / pull --rebase / push the share only (what hooks and the timer run)")).action(shareSyncAction("cs share-sync"));

// ------------------------------------------------------------------ occasionally
program.command("new <name>").description("create a project: dir, git, private GitHub repo, first push, registered, Claude wired in")
  .option("--identity <id>", "identity id (or --<id> / --<github-owner>, e.g. --personal)").option("--profiles <list>").option("-d, --description <text>", "", "").option("--public")
  .action(async (name, o) => { const { repo, m, man } = ctx(); let id = o.identity;
    if (!id) throw new Error(`cs: which identity? use one of ${Object.keys(man.identities).map((i) => "--" + i).join(", ")} (or --identity <id>)`);
    const ident = man.identities[id] ?? identityByFlag(man, id); if (!ident) throw new Error(`cs: unknown identity '${id}'`);
    const profiles = csv(o.profiles).length ? csv(o.profiles) : m.profiles.includes(ident.id) ? [ident.id] : [...m.profiles];
    const { create } = await import("./projects.js"); process.exitCode = await create(repo, m, man, name, ident, { profiles, description: o.description, priv: !o.public }); });
program.command("add [path]").description("register an existing directory as a project (default: cwd); creates its private GitHub repo when it has no remote").option("--profiles <list>").option("--identity <id>").option("--name <name>").option("--description <text>", "", "").option("--public").option("--no-commit")
  .action(async (p, o) => { const { repo, m, man } = ctx(); const { add } = await import("./projects.js"); await ui.command("cs add", () => add(repo, m, man, p, { profiles: csv(o.profiles), identity: o.identity, name: o.name, description: o.description, noCommit: !o.commit, priv: !o.public })); });
program.command("clone [names...]").description("clone the projects selected for this machine that are missing here").option("--dry-run").action(async (names, o) => { const { repo, m, man } = ctx(); const { clone } = await import("./projects.js");
  await ui.command("cs clone", async () => { process.exitCode = await ui.group(o.dryRun ? "would clone" : "cloned", () => clone(repo, m, man, names, o.dryRun), { done: "nothing missing" }); }); });

const sec = program.command("secrets").description("encrypted secrets in the share: set | get | edit").enablePositionalOptions();
const S = () => import("./secretscmd.js");
sec.command("set <name> <pairs...>").description("global | <project>  KEY=VALUE …").action(async (n, pairs) => { const { repo, m } = ctx(); await (await S()).setValues(repo, m, n, pairs); });
sec.command("get <name> [key]").description("global | <project>  (masked; --show for values)").option("--show").action(async (n, k, o) => { const { repo, m } = ctx(); process.exitCode = await (await S()).get(repo, m, n, k, o.show); });
sec.command("edit <name>").description("global | <project>  in $EDITOR").action(async (n) => { const { repo, m } = ctx(); await (await S()).edit(repo, m, n); });
sec.command("unset <name> <keys...>", HIDDEN).action(async (n, keys) => { const { repo, m } = ctx(); await (await S()).unsetValues(repo, m, n, keys); });
sec.command("init", HIDDEN).action(async () => { const { repo, m } = ctx(); await ui.command("cs secrets init", async () => ui.group("secrets", async () => (await S()).init(repo, m, ui.isTTY()))); });
sec.command("status", HIDDEN).action(async () => { const { repo, m } = ctx(); ui.intro("cs secrets status"); await (await S()).status(repo, m); ui.outro(ui.dim("cs secrets set · cs trust <machine>")); });
sec.command("pull <project>", HIDDEN).option("--force").action(async (p, o) => { const { repo, m, man } = ctx(); process.exitCode = await (await S()).pull(repo, m, man, p, o.force); });
sec.command("push <project>", HIDDEN).action(async (p) => { const { repo, m, man } = ctx(); process.exitCode = await (await S()).push(repo, m, man, p); });
sec.command("diff <project>", HIDDEN).action(async (p) => { const { repo, m, man } = ctx(); process.exitCode = await (await S()).diff(repo, m, man, p); });
sec.command("exec [command...]", HIDDEN).description("run a command with global + project secrets in its environment").option("-p, --project <name>").passThroughOptions().allowUnknownOption()
  .action(async (command, o) => { const { repo, m, man } = ctx(); const cmd = command[0] === "--" ? command.slice(1) : command; process.exitCode = await (await S()).exec(repo, m, man, o.project, cmd); });
sec.command("recovery", HIDDEN).action(async () => { const { repo, m } = ctx(); await ui.command("cs secrets recovery", async () => (await S()).recovery(repo, m)); });

const ident = program.command("identity").description("git identities: who commits, with which key, under which GitHub owner");
ident.command("ls", { isDefault: true }).description("list identities").action(async () => { const { man } = ctx(); (await import("./identity.js")).ls(man); });
ident.command("add <id>").requiredOption("--owner <owner>", "GitHub user or org").requiredOption("--name <name>").requiredOption("--email <email>").option("--key <path>").option("--no-token")
  .action(async (id, o) => { const { repo, m, man } = ctx(); process.exitCode = await (await import("./identity.js")).add(repo, m, man, id, { owner: o.owner, name: o.name, email: o.email, key: o.key, noToken: !o.token }); });
ident.command("rename <old> <new>").action(async (a, b) => { const { repo, m, man } = ctx(); process.exitCode = (await import("./identity.js")).rename(repo, m, man, a, b); });

program.command("trust <machine>").description("trust another machine: let it read the secrets").action(async (mc) => { const { repo, m } = ctx(); await ui.command(`cs trust ${mc}`, async () => ui.group("trusted", async () => (await S()).trust(repo, m, mc)), { outro: () => ui.dim(`now: cs sync here, then cs sync on ${mc}`) }); });
program.command("untrust <machine>", HIDDEN).description("untrust a machine: remove its access to the secrets").action(async (mc) => { const { repo, m } = ctx(); await ui.command(`cs untrust ${mc}`, async () => ui.group("untrusted", async () => (await S()).untrust(repo, m, mc))); });

// ------------------------------------------------------------------ setup
program.command("doctor").description("check this machine: tools, links, identities, remotes, hooks, timer; --fix repairs what it can").option("--fix").action(async (o) => { const { repo, m, man } = ctx(); const { runDoctor } = await import("./doctor.js"); ui.intro("cs doctor"); process.exitCode = await runDoctor(repo, m, man, o.fix); ui.outro(process.exitCode ? ui.red("problems found") : ui.green("all good")); });
program.command("update").description("update the cs tool itself").action(async () => { await ui.command("cs update", async () => {
  const root = toolRoot(); if (!git.isRepo(root)) throw new Error(`cs: ${root} is not a git checkout`);
  const before = git.out(["rev-parse", "--short", "HEAD"], root);
  const r = await ui.spin("checking for updates…", () => git.gitA(["pull", "-q", "--ff-only"], root, { check: false, timeout: 60 }));
  if (r.code !== 0) throw new Error(`cs: update failed\n${r.err}`);
  const after = git.out(["rev-parse", "--short", "HEAD"], root);
  if (before === after) ui.ok(`already up to date  ${ui.dim(`(${after})`)}`); else { const n = git.out(["rev-list", "--count", `${before}..${after}`], root); ui.ok(`updated ${before} → ${after}  ${ui.dim(`${n} commit(s)`)}`); for (const l of git.out(["log", "--format=%s", `${before}..${after}`], root).split("\n").slice(0, 8)) ui.info(ui.dim("• " + l)); }
  writeUpdateCache({ checkedAt: Date.now(), behind: 0 });
  }, { outro: () => ui.dim(`cs ${pkg.version}`) }); });
program.command("init").description("set this machine up (wizard) — or --repo <url> / --owner <owner> for scripts")
  .option("--repo <url>", "existing share: git URL or local path").option("--owner <owner>", "GitHub user/org to create claude-share-config under")
  .option("--key <path>", "ssh key for cloning --repo (instead of the share key)").option("--non-interactive").option("--name <name>", "machine name")
  .option("--profiles <list>", "comma list").option("--workspace <path>").option("--skip <phases>", "comma list: deps,share,ssh,apply,link,secrets,hooks,doctor").option("--install-deps")
  .action(async (o) => { const { init } = await import("./init.js"); process.exitCode = await init({ repo: o.repo, owner: o.owner, key: o.key, name: o.name, profiles: csv(o.profiles), workspace: o.workspace, skip: csv(o.skip), installDeps: o.installDeps, interactive: !o.nonInteractive && (ui.isTTY() || ui.isScripted()) }); });

// ------------------------------------------------------------------ hidden: the pieces cs sync / cs init run, kept callable for debugging
program.command("status", HIDDEN).description("what bare `cs` shows").option("--no-fetch").option("--all").action(async (o) => { const { repo, m, man } = ctx(); const { runStatus } = await import("./status.js"); ui.intro(`cs status  ${ui.dim(m.name)}`); const r = await runStatus(repo, m, man, o.fetch, o.all); process.exitCode = r.rc; ui.outro(r.next ? ui.yellow(`run: ${r.next}`) : ui.dim("cs sync · cs doctor")); });
program.command("apply", HIDDEN).description("render ~/.claude + git identity includes from the share").option("--check", "report drift, change nothing")
  .action(async (o) => { const { repo, m, man } = ctx(); const { runApply } = await import("./apply.js");
    await ui.command(o.check ? "cs apply --check" : "cs apply", async () => { const n = (await ui.group(o.check ? "drift" : "~/.claude applied", () => runApply(repo, m, man, o.check), { done: o.check ? "no drift" : "already up to date" })).length; process.exitCode = o.check && n ? 1 : 0; }); });
program.command("link [names...]", HIDDEN).description("place project state (Claude files, memory) into project checkouts; newer content flows back").option("--check")
  .action(async (names, o) => { const { repo, m, man } = ctx(); const { runLink } = await import("./link.js");
    await ui.command(o.check ? "cs link --check" : "cs link", async () => { const n = await ui.group(o.check ? "pending changes" : "project files linked", () => runLink(repo, m, man, names, o.check), { done: "nothing pending" }); process.exitCode = o.check && n ? 1 : 0; }); });
program.command("import <what> [names...]", HIDDEN).description("take existing local state into the share (memory | project | mcp)").option("--all").option("--check").option("--show", "(mcp) print the secret values")
  .action(async (what, names, o) => { const { repo, m, man } = ctx(); const { runImport } = await import("./import.js"); const { selectedProjects } = await import("./manifest.js");
    const targets = names.length ? names : o.all ? selectedProjects(man, m).map((p) => p.name) : [];
    if (o.show) { runImport(repo, m, man, what, targets, o.check, true); return; }
    await ui.command(`cs import ${what}`, async () => { for (const n of targets) await ui.group(n, () => runImport(repo, m, man, what, [n], o.check, false), { done: "nothing to import" }); }); });
program.command("hooks [action]", HIDDEN).description("automatic share sync: install | remove | status").option("--no-timer").action(async (action = "status", o) => { const { repo, m } = ctx(); const { runHooks } = await import("./hooks.js");
  if (action === "status") { ui.intro("cs hooks"); process.exitCode = await runHooks(repo, m, action, o.timer); ui.outro(ui.dim("cs hooks install · cs hooks remove")); return; }
  await ui.command(`cs hooks ${action}`, async () => { process.exitCode = await ui.group(action === "remove" ? "removed" : "installed", () => runHooks(repo, m, action, o.timer)); }); });
const token = program.command("token", HIDDEN).description("GitHub API tokens per owner (local, never synced)");
token.command("set <owner>").action(async (o) => { const gh = await import("./github.js"); const f = await gh.setToken(o); ui.ok(`token stored in ${(await import("./paths.js")).contract(f)} (0600, not synced)`); });
token.command("check <owner>").action(async (o) => { const gh = await import("./github.js"); const t = gh.getToken(o); if (!t) { ui.fail(`no token for '${o}'`); process.exitCode = 1; return; } try { const who = await ui.spin(`checking token for ${o}…`, async () => gh.whoami(t)); ui.ok(`token for '${o}' authenticates as ${who}`); } catch (e: any) { ui.fail(e.message); process.exitCode = 1; } });
token.command("rm <owner>").action(async (o) => { (await import("./github.js")).rmToken(o); ui.ok("removed"); });
token.command("ls").action(() => { const d = join(csConfigDir(), "tokens"); if (existsSync(d)) for (const f of readdirSync(d)) console.log(f); });
program.command("ssh [action]", HIDDEN).description("per-machine SSH keys: setup | check | share-key").action(async (action = "check") => { const { repo, m, man } = ctx();
  await ui.command(`cs ssh ${action}`, async () => { if (action === "share-key") process.exitCode = await (await import("./sharekey.js")).setup(repo, ui.isTTY()); else process.exitCode = await (await import("./ssh.js")).setup(repo, m, man, action === "check"); },
    { outro: () => (process.exitCode ? ui.yellow("keys still to register — re-run cs ssh check afterwards") : ui.green("all keys verified")) }); });
program.command("deps", HIDDEN).description("check (or install) prerequisites").option("--install").action(async (o) => { await ui.command(o.install ? "cs deps --install" : "cs deps", async () => { process.exitCode = await (await import("./deps.js")).runDeps(o.install); }, { outro: () => (process.exitCode ? ui.red("required tools missing") : ui.green("all required tools present")) }); });
const share = program.command("share", HIDDEN).description("the share itself: new <path> | path");
share.command("new <path>").description("create a share skeleton").action(async (p) => { const { newShare } = await import("./init.js"); const { expand, contract } = await import("./paths.js"); const d = newShare(expand(p)); ui.ok(`share created at ${contract(d)} — edit projects.toml, then cs init --repo ${contract(d)}`); });
share.command("path").description("print the share path").action(() => console.log(shareDir(loadMachine())));
const proj = program.command("project", HIDDEN).description("project helpers: id");
proj.command("id").description("print the project name for the cwd").action(() => { const { m, man } = ctx(); const p = projectForPath(man, m, process.cwd()); if (p) console.log(p.name); else process.exitCode = 1; });

// the manual halves of cs sync
const H = () => import("./handoff.js");
program.command("handoff [projects...]", HIDDEN).description("send a handoff: uncommitted work of the cwd project (or --all) to its remote")
  .option("-m, --note <text>", "note shown when the work is resumed").option("--all", "every selected project").option("--dry-run").option("--allow <glob>", "override the secret-file deny list", (v: string, a: string[]) => [...a, v], [] as string[]).option("--overwrite", "replace a handoff another machine left")
  .addOption(new Option("--mark").hideHelp()).option("-q, --quiet")   // --mark: what the retired SessionEnd hook ran; a no-op until cs sync re-installs the hooks
  .action(async (names, o) => { if (o.mark) return; const { repo, m, man } = ctx(); const h = await H();
    await ui.command("cs handoff", async () => { const projects = h.projectsFor(man, m, names, o.all);
      process.exitCode = await ui.group("handed off", () => h.handoff(repo, m, man, projects, { note: o.note, dryRun: o.dryRun, allow: o.allow, overwrite: o.overwrite }), { done: "nothing to hand off" });
      if (!o.dryRun) { const { runShareSync } = await import("./sharesync.js"); await ui.group("share pushed", () => runShareSync(repo, m, man, { pushOnly: true, timeout: 20 }), { done: "already in sync" }); } },
      { outro: () => (process.exitCode ? ui.red("some units not handed off — see above") : ui.dim("on the other machine: cs sync")) }); });
program.command("resume [projects...]", HIDDEN).description("apply waiting handoffs as uncommitted changes and delete them from the remote")
  .option("--all").option("--replace", "discard local uncommitted changes in the target (a backup ref is kept)").option("--keep-remote", "leave the handoff on the remote").option("--dry-run")
  .action(async (names, o) => { const { repo, m, man } = ctx(); const h = await H();
    await ui.command("cs resume", async () => { const projects = h.projectsFor(man, m, names, o.all);
      const { runShareSync } = await import("./sharesync.js"); await ui.group("share pulled", () => runShareSync(repo, m, man, { pullOnly: true, timeout: 10 }), { done: "up to date" });
      process.exitCode = await ui.group("resumed", () => h.resume(repo, m, man, projects, { replace: o.replace, keepRemote: o.keepRemote, dryRun: o.dryRun }), { done: "no handoffs waiting" }); },
      { outro: () => (process.exitCode ? ui.red("some handoffs not applied — see above") : ui.dim("carry on: claude")) }); });
const handoffs = program.command("handoffs", HIDDEN).description("handoffs waiting on remotes: ls | gc | drop");
handoffs.command("ls", { isDefault: true }).option("--all").action(async (o) => { const { m, man } = ctx(); const h = await H(); const projects = h.projectsFor(man, m, [], o.all ?? true);
  ui.intro("cs handoffs"); const list = await h.waitingList(m, man, projects);
  if (!list.length) ui.info(ui.dim("no handoffs waiting")); else ui.table(list.map((x) => [x.worktree, x.branch, x.machine, x.when.slice(0, 16), ui.dim(x.note)]), ["project", "branch", "from", "when", "note"]);
  ui.outro(ui.dim("cs sync · cs handoffs gc --older-than 14")); });
handoffs.command("gc").option("--older-than <days>", "", "14").option("--all").action(async (o) => { const { m, man } = ctx(); const h = await H(); await ui.command("cs handoffs gc", async () => ui.group("dropped", () => h.handoffGc(m, man, h.projectsFor(man, m, [], true), +o.olderThan), { done: "nothing older than that" })); });
handoffs.command("drop <branch>").description("delete one waiting handoff (branch name or full ref) for the cwd project").action(async (b) => { const { m, man } = ctx(); const h = await H(); const [p] = h.projectsFor(man, m, [], false); await ui.command("cs handoffs drop", () => h.handoffDrop(m, man, p, b)); });
program.command("note", HIDDEN).description("print (once) the note of the last handoff applied for the cwd project").option("--print").action(async () => { const { m, man } = ctx(); const h = await H(); if (!h.printNote(man, m)) process.exitCode = 1; });

program.command("ui-demo", HIDDEN).description("show every UI element with fake data").action(async () => {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  await ui.command("cs ui-demo", async () => {
    await ui.spin("a 2-second spinner (must animate)…", () => sleep(2000));
    await ui.group("grouped phase with items", async () => { for (const n of ["alpha", "beta", "gamma"]) { await ui.spin(`working on ${n}…`, () => sleep(600)); ui.step(`${n} done`); } });
    await ui.group("empty phase", () => {}, { done: "nothing to do" });
    ui.table([[ui.green("✓"), "node", ui.dim("v22")], [ui.yellow("!"), "gh", ui.dim("missing")]]);
    ui.note([`title  ${ui.bold("cs:demo:share-key")}`, `key    ${ui.bold("ssh-ed25519 AAAA… cs:demo:share-key")}`], "a note box");
    ui.warn("a warning"); ui.fail("an error line (does not abort)");
    if (ui.isTTY()) { const v = await ui.select("a select", [{ value: "a", label: "Option A", hint: "hint" }, { value: "b", label: "Option B" }]); const ok = await ui.confirm(`you picked ${v} — confirm?`, true); ui.step(`confirm → ${ok}`); }
  }, { outro: () => ui.dim("demo over") });
});

// ---- outdated check: at most once a day, in the background, never blocking the command
const updateCacheFile = () => join(stateDir(), "update-check.json");
function readUpdateCache(): { checkedAt: number; behind: number } { try { return JSON.parse(readFileSync(updateCacheFile(), "utf8")); } catch { return { checkedAt: 0, behind: 0 }; } }
function writeUpdateCache(c: { checkedAt: number; behind: number }) { try { mkdirSync(stateDir(), { recursive: true }); writeFileSync(updateCacheFile(), JSON.stringify(c)); } catch {} }
async function startUpdateCheck(): Promise<() => Promise<number>> {
  const root = toolRoot(); const cache = readUpdateCache();
  if (process.env.CS_OFFLINE || !git.isRepo(root)) return async () => 0;
  if (Date.now() - cache.checkedAt < 24 * 3600 * 1000) return async () => cache.behind;
  const { exec } = await import("./proc.js");
  const run = exec("git", ["fetch", "-q", "origin"], { cwd: root, timeout: 3 }).then((r) => {
    if (r.code !== 0) return cache.behind;
    const branch = git.currentBranch(root) || "master";
    const behind = parseInt(git.out(["rev-list", "--count", `HEAD..origin/${branch}`], root, "0"), 10) || 0;
    writeUpdateCache({ checkedAt: Date.now(), behind }); return behind;
  }).catch(() => 0);
  return () => run;
}

async function main() {
  platform.refuseUnsupported();
  process.stdout.on("error", (e: any) => { if (e?.code === "EPIPE") process.exit(0); throw e; });
  const argv = process.argv.slice(2);
  // `cs new foo --personal` → `--identity personal` (identity id or GitHub owner)
  if (argv[0] === "new" && machineExists()) { try { const { man } = ctx(); for (let i = 1; i < argv.length; i++) { const a = argv[i]; if (a.startsWith("--") && !a.includes("=")) { const hit = identityByFlag(man, a.slice(2)); if (hit) argv.splice(i, 1, "--identity", hit.id); } } process.argv = [...process.argv.slice(0, 2), ...argv]; } catch {} }
  // bare `cs` (hidden --no-fetch for scripts): the status view, ending with the command that resolves what it found
  if (argv.every((a) => a === "--no-fetch")) { if (machineExists()) { const finish = await startUpdateCheck(); const { repo, m, man } = ctx(); const { runStatus } = await import("./status.js"); ui.intro(`claude-share  ${ui.dim(m.name)}`); const r = await runStatus(repo, m, man, !argv.length); process.exitCode = r.rc; const behind = await Promise.race([finish(), new Promise<number>((r) => setTimeout(() => r(0), 50))]);
    const tail = [r.next ? ui.yellow(`run: ${r.next}`) : "", behind > 0 ? ui.yellow(`cs is ${behind} commit(s) behind — run cs update`) : ""].filter(Boolean); ui.outro(tail.length ? tail.join("  ·  ") : ui.dim("cs sync · cs new <project> --<identity> · cs --help")); return; } program.help(); }
  const cmdName = argv.find((a) => !a.startsWith("-"));
  const wantsCheck = !["update", "ui-demo"].includes(cmdName ?? "") && !argv.includes("-q") && !argv.includes("--quiet");
  const finishCheck = wantsCheck ? await startUpdateCheck() : async () => 0;
  try { await program.parseAsync(process.argv); }
  catch (e: any) { if (e?.handled) { process.exitCode = e.code ?? 1; return; } const msg: string = e?.message ?? String(e); if (msg.startsWith("cs: ")) { const [what, ...rest] = msg.slice(4).split("\n"); ui.error(what, rest.join("\n").trim()); process.exitCode = 1; } else throw e; }
  finally { const behind = await Promise.race([finishCheck(), new Promise<number>((r) => setTimeout(() => r(0), 50))]); if (behind > 0) console.error(ui.yellow("!") + ` cs is ${behind} commit(s) behind — run ${ui.bold("cs update")}`); }
}
main();
