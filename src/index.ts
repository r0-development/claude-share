/** cs — command tree (commander). One subcommand → one module. Visible tier = what a user must know; the rest is hidden. */
import { Command, Option } from "commander";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as ui from "./ui.js";
import * as platform from "./platform.js";
import { loadMachine, machineExists, shareDir } from "./machine.js";
import { open, projectForPath } from "./share.js";
import { toolRoot } from "./paths.js";
import { behindCount, behindHint, startUpdateCheck } from "./update.js";

const pkg = JSON.parse(readFileSync(join(toolRoot(), "package.json"), "utf8")) as { version: string };
const csv = (s?: string) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);
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
  cs remove old-thing                      take a project out of the share (its checkout and GitHub repo stay)
  cs secrets set global API_TOKEN=…        encrypted; available to Claude's MCP servers as \${API_TOKEN}
  cs trust laptop                          let another machine read the secrets

setup
  cs init                                  set this machine up (wizard: join or create a share)
  cs doctor --fix                          check everything; fix what can be fixed`);
program.hook("preAction", (_root, cmd) => ui.setQuiet(Boolean(program.opts().quiet || (cmd.opts() as any).quiet)));

// ------------------------------------------------------------------ daily
// share-sync: the share alone (commit / pull --rebase / push) — what the hooks and the timer run. `cs sync` is the daily verb on top of it.
const shareSyncAction = (title: string) => async (o: any) => { const share = open(); const { runShareSync } = await import("./sharesync.js"); const opts = { pullOnly: o.pullOnly, pushOnly: o.pushOnly, timeout: +o.timeout, resolve: o.resolve, debounce: +o.debounce };
    if (o.quiet || program.opts().quiet) { process.exitCode = await runShareSync(share, opts); return; }
    await ui.command(title, async () => { process.exitCode = await runShareSync(share, opts); }, { outro: () => (process.exitCode ? ui.red("not synced — see above") : ui.dim("in sync")) }); };
const shareSyncOpts = (c: Command) => c.option("--pull-only").option("--push-only").option("--timeout <s>", "", "20").option("--resolve <ours|theirs|newest>", "how a file changed on both machines is settled (default newest)").option("--debounce <s>", "skip if a sync ran less than N seconds ago", "0").option("-q, --quiet");
program.command("sync").description("the daily verb: bring this machine up to date and leave nothing stale here")
  .option("-m, --note <text>", "note carried by the handoffs sent (shown where the work is resumed)")
  .addOption(new Option("--timeout <s>", "").default("20").hideHelp()).addOption(new Option("-q, --quiet").hideHelp())
  // hooks installed before cs sync became the daily verb call `cs sync --push-only|--pull-only`; those stay the share-only sync (ADR-0002: never a project remote unattended)
  .addOption(new Option("--pull-only").hideHelp()).addOption(new Option("--push-only").hideHelp()).addOption(new Option("--debounce <s>").default("0").hideHelp())
  .action(async (o) => { if (o.pullOnly || o.pushOnly) return shareSyncAction("cs sync")(o);
    const share = open(); const { runSync } = await import("./sync.js");
    await ui.command(`cs sync  ${ui.dim(share.machine.name)}`, async () => { const r = await runSync(share, { note: o.note, timeout: +o.timeout }); process.exitCode = r.rc; return r.summary; }, { outro: (s) => s }); });
shareSyncOpts(program.command("share-sync", HIDDEN).description("commit / pull --rebase / push the share only (what hooks and the timer run)")).action(shareSyncAction("cs share-sync"));

// ------------------------------------------------------------------ occasionally
program.command("new <name>").description("create a project: dir, git, private GitHub repo, first push, registered, Claude wired in")
  .option("--identity <id>", "identity id (or --<id> / --<github-owner>, e.g. --personal)").option("--profiles <list>").option("-d, --description <text>", "", "").option("--public")
  .action(async (name, o) => { const share = open(); const { create, newProjectOptions } = await import("./projects.js");
    const { ident, profiles } = newProjectOptions(share, { identity: o.identity, profiles: csv(o.profiles) });
    process.exitCode = await create(share, name, ident, { profiles, description: o.description, priv: !o.public }); });
program.command("add [path]").description("register an existing directory as a project (default: cwd); creates its private GitHub repo when it has no remote").option("--profiles <list>").option("--identity <id>").option("--name <name>").option("--description <text>", "", "").option("--public").option("--no-commit")
  .action(async (p, o) => { const share = open(); const { add } = await import("./projects.js"); await ui.command("cs add", () => add(share, p, { profiles: csv(o.profiles), identity: o.identity, name: o.name, description: o.description, noCommit: !o.commit, priv: !o.public })); });
program.command("remove <names...>").description("take projects out of the share: manifest entry, project state, secrets; checkouts and remotes stay").option("-y, --yes", "skip the confirmation").option("--no-commit")
  .action(async (names, o) => { const share = open(); const { remove } = await import("./remove.js"); await ui.command(`cs remove ${names.join(" ")}`, () => remove(share, names, { yes: o.yes, noCommit: !o.commit }), { outro: (s) => s }); });
program.command("clone [names...]").description("clone the projects selected for this machine that are missing here").option("--dry-run").action(async (names, o) => { const share = open(); const { clone } = await import("./projects.js");
  await ui.command("cs clone", async () => { process.exitCode = await ui.group(o.dryRun ? "would clone" : "cloned", () => clone(share, names, o.dryRun), { done: "nothing missing" }); }); });

const sec = program.command("secrets").description("encrypted secrets in the share: set | get | edit").enablePositionalOptions();
const S = () => import("./secretscmd.js");
sec.command("set <name> <pairs...>").description("global | <project>  KEY=VALUE …").action(async (n, pairs) => { const share = open(); await (await S()).setValues(share, n, pairs); });
sec.command("get <name> [key]").description("global | <project>  (masked; --show for values)").option("--show").action(async (n, k, o) => { const share = open(); process.exitCode = await (await S()).get(share, n, k, o.show); });
sec.command("edit <name>").description("global | <project>  in $EDITOR").action(async (n) => { const share = open(); await (await S()).edit(share, n); });
sec.command("unset <name> <keys...>", HIDDEN).action(async (n, keys) => { const share = open(); await (await S()).unsetValues(share, n, keys); });
sec.command("init", HIDDEN).action(async () => { const share = open(); await ui.command("cs secrets init", async () => ui.group("secrets", async () => (await S()).init(share, ui.isTTY()))); });
sec.command("status", HIDDEN).action(async () => { const share = open(); ui.intro("cs secrets status"); await (await S()).status(share); ui.outro(ui.dim("cs secrets set · cs trust <machine>")); });
sec.command("pull <project>", HIDDEN).option("--force").action(async (p, o) => { const share = open(); process.exitCode = await (await S()).pull(share, p, o.force); });
sec.command("push <project>", HIDDEN).action(async (p) => { const share = open(); process.exitCode = await (await S()).push(share, p); });
sec.command("diff <project>", HIDDEN).action(async (p) => { const share = open(); process.exitCode = await (await S()).diff(share, p); });
sec.command("exec [command...]", HIDDEN).description("run a command with global + project secrets in its environment").option("-p, --project <name>").passThroughOptions().allowUnknownOption()
  .action(async (command, o) => { const share = open(); const cmd = command[0] === "--" ? command.slice(1) : command; process.exitCode = await (await S()).exec(share, o.project, cmd); });
sec.command("recovery", HIDDEN).action(async () => { const share = open(); await ui.command("cs secrets recovery", async () => (await S()).recovery(share)); });

const ident = program.command("identity").description("git identities: who commits, with which key, under which GitHub owner");
ident.command("ls", { isDefault: true }).description("list identities").action(async () => { const share = open(); (await import("./identity.js")).ls(share.manifest); });
ident.command("add <id>").requiredOption("--owner <owner>", "GitHub user or org").requiredOption("--name <name>").requiredOption("--email <email>").option("--key <path>").option("--no-token")
  .action(async (id, o) => { const share = open(); process.exitCode = await (await import("./identity.js")).add(share, id, { owner: o.owner, name: o.name, email: o.email, key: o.key, noToken: !o.token }); });
ident.command("rename <old> <new>").action(async (a, b) => { const share = open(); process.exitCode = (await import("./identity.js")).rename(share, a, b); });

program.command("trust <machine>").description("trust another machine: let it read the secrets").action(async (mc) => { const share = open(); await ui.command(`cs trust ${mc}`, async () => ui.group("trusted", async () => (await S()).trust(share, mc)), { outro: () => ui.dim(`now: cs sync here, then cs sync on ${mc}`) }); });
program.command("untrust <machine>", HIDDEN).description("untrust a machine: remove its access to the secrets").action(async (mc) => { const share = open(); await ui.command(`cs untrust ${mc}`, async () => ui.group("untrusted", async () => (await S()).untrust(share, mc))); });

// ------------------------------------------------------------------ setup
program.command("doctor").description("check this machine: tools, links, identities, remotes, hooks, timer; --fix repairs what it can").option("--fix").action(async (o) => { const share = open(); const { runDoctor } = await import("./doctor.js"); ui.intro("cs doctor"); process.exitCode = await runDoctor(share, o.fix); ui.outro(process.exitCode ? ui.red("problems found") : ui.green("all good")); });
program.command("update").description("update the cs tool itself").action(async () => { const { runUpdate } = await import("./update.js"); await ui.command("cs update", runUpdate, { outro: () => ui.dim(`cs ${pkg.version}`) }); });
program.command("init").description("set this machine up (wizard) — or --repo <url> / --owner <owner> for scripts")
  .option("--repo <url>", "existing share: git URL or local path").option("--owner <owner>", "GitHub user/org to create claude-share-config under")
  .option("--key <path>", "ssh key for cloning --repo (instead of the share key)").option("--non-interactive").option("--name <name>", "machine name")
  .option("--profiles <list>", "comma list").option("--workspace <path>").option("--skip <phases>", "comma list: deps,share,ssh,apply,link,secrets,hooks,doctor").option("--install-deps")
  .action(async (o) => { const { init } = await import("./init.js"); process.exitCode = await init({ repo: o.repo, owner: o.owner, key: o.key, name: o.name, profiles: csv(o.profiles), workspace: o.workspace, skip: csv(o.skip), installDeps: o.installDeps, interactive: !o.nonInteractive && (ui.isTTY() || ui.isScripted()) }); });

// ------------------------------------------------------------------ hidden: the pieces cs sync / cs init run, kept callable for debugging
program.command("status", HIDDEN).description("what bare `cs` shows").option("--no-fetch").option("--all").action(async (o) => { const share = open(); const { runStatus } = await import("./status.js"); ui.intro(`cs status  ${ui.dim(share.machine.name)}`); const r = await runStatus(share, o.fetch, o.all); process.exitCode = r.rc; ui.outro(r.next ? ui.yellow(`run: ${r.next}`) : ui.dim("cs sync · cs doctor")); });
program.command("apply", HIDDEN).description("render ~/.claude + git identity includes from the share").option("--check", "report drift, change nothing")
  .action(async (o) => { const share = open(); const { runApply } = await import("./apply.js");
    await ui.command(o.check ? "cs apply --check" : "cs apply", async () => { const n = (await ui.group(o.check ? "drift" : "~/.claude applied", () => runApply(share, o.check), { done: o.check ? "no drift" : "already up to date" })).length; process.exitCode = o.check && n ? 1 : 0; }); });
program.command("link [names...]", HIDDEN).description("place project state (Claude files, memory) into project checkouts; newer content flows back").option("--check")
  .action(async (names, o) => { const share = open(); const { placeAll } = await import("./projectstate.js");
    await ui.command(o.check ? "cs link --check" : "cs link", async () => { const n = await ui.group(o.check ? "pending changes" : "project files linked", () => { const lines = placeAll(share, { names, check: o.check }); ui.steps(lines); return lines.length; }, { done: "nothing pending" }); process.exitCode = o.check && n ? 1 : 0; }); });
program.command("import <what> [names...]", HIDDEN).description("take existing local state into the share (memory | project | mcp)").option("--all").option("--check").option("--show", "(mcp) print the secret values")
  .action(async (what, names, o) => { const share = open(); const { runImport } = await import("./import.js"); const { selectedProjects } = await import("./share.js");
    const targets = names.length ? names : o.all ? selectedProjects(share).map((p) => p.name) : [];
    if (o.show) { runImport(share, what, targets, o.check, true); return; }
    await ui.command(`cs import ${what}`, async () => { for (const n of targets) await ui.group(n, () => runImport(share, what, [n], o.check, false), { done: "nothing to import" }); }); });
program.command("hooks [action]", HIDDEN).description("automatic share sync: install | remove | status").option("--no-timer").action(async (action = "status", o) => { const share = open(); const { runHooks } = await import("./hooks.js");
  if (action === "status") { ui.intro("cs hooks"); process.exitCode = await runHooks(share, action, o.timer); ui.outro(ui.dim("cs hooks install · cs hooks remove")); return; }
  await ui.command(`cs hooks ${action}`, async () => { process.exitCode = await ui.group(action === "remove" ? "removed" : "installed", () => runHooks(share, action, o.timer)); }); });
const token = program.command("token", HIDDEN).description("GitHub API tokens per owner (local, never synced)");
token.command("set <owner>").action(async (o) => { const gh = await import("./github.js"); const f = await gh.setToken(o); ui.ok(`token stored in ${(await import("./paths.js")).contract(f)} (0600, not synced)`); });
token.command("check <owner>").action(async (o) => { const gh = await import("./github.js"); const t = gh.getToken(o); if (!t) { ui.fail(`no token for '${o}'`); process.exitCode = 1; return; } try { const who = await ui.spin(`checking token for ${o}…`, async () => gh.whoami(t)); ui.ok(`token for '${o}' authenticates as ${who}`); } catch (e: any) { ui.fail(e.message); process.exitCode = 1; } });
token.command("rm <owner>").action(async (o) => { (await import("./github.js")).rmToken(o); ui.ok("removed"); });
token.command("ls").action(async () => { for (const o of (await import("./github.js")).listTokens()) console.log(o); });
program.command("ssh [action]", HIDDEN).description("per-machine SSH keys: setup | check | share-key").action(async (action = "check") => { const share = open();
  await ui.command(`cs ssh ${action}`, async () => { if (action === "share-key") process.exitCode = await (await import("./sharekey.js")).setup(share.path, ui.isTTY()); else process.exitCode = await (await import("./ssh.js")).setup(share, action === "check"); },
    { outro: () => (process.exitCode ? ui.yellow("keys still to register — re-run cs ssh check afterwards") : ui.green("all keys verified")) }); });
program.command("deps", HIDDEN).description("check (or install) prerequisites").option("--install").action(async (o) => { await ui.command(o.install ? "cs deps --install" : "cs deps", async () => { process.exitCode = await (await import("./deps.js")).runDeps(o.install); }, { outro: () => (process.exitCode ? ui.red("required tools missing") : ui.green("all required tools present")) }); });
const shareCmd = program.command("share", HIDDEN).description("the share itself: new <path> | path");
shareCmd.command("new <path>").description("create a share skeleton").action(async (p) => { const { newShare } = await import("./init.js"); const { expand, contract } = await import("./paths.js"); const d = newShare(expand(p)); ui.ok(`share created at ${contract(d)} — edit projects.toml, then cs init --repo ${contract(d)}`); });
shareCmd.command("path").description("print the share path").action(() => console.log(shareDir(loadMachine())));
const proj = program.command("project", HIDDEN).description("project helpers: id");
proj.command("id").description("print the project name for the cwd").action(() => { const share = open(); const p = projectForPath(share, process.cwd()); if (p) console.log(p.name); else process.exitCode = 1; });

// the manual halves of cs sync
const H = () => import("./handoff.js");
program.command("handoff [projects...]", HIDDEN).description("send a handoff: uncommitted work of the cwd project (or --all) to its remote")
  .option("-m, --note <text>", "note shown when the work is resumed").option("--all", "every selected project").option("--dry-run").option("--allow <glob>", "override the secret-file deny list", (v: string, a: string[]) => [...a, v], [] as string[]).option("--overwrite", "replace a handoff another machine left")
  .addOption(new Option("--mark").hideHelp()).option("-q, --quiet")   // --mark: what the retired SessionEnd hook ran; a no-op until cs sync re-installs the hooks
  .action(async (names, o) => { if (o.mark) return; const share = open(); const h = await H();
    await ui.command("cs handoff", async () => { const projects = h.projectsFor(share, names, o.all);
      process.exitCode = await ui.group("handed off", () => h.handoff(share, projects, { note: o.note, dryRun: o.dryRun, allow: o.allow, overwrite: o.overwrite }), { done: "nothing to hand off" });
      if (!o.dryRun) { const { runShareSync } = await import("./sharesync.js"); await ui.group("share pushed", () => runShareSync(share, { pushOnly: true, timeout: 20 }), { done: "already in sync" }); } },
      { outro: () => (process.exitCode ? ui.red("some units not handed off — see above") : ui.dim("on the other machine: cs sync")) }); });
program.command("resume [projects...]", HIDDEN).description("apply waiting handoffs as uncommitted changes and delete them from the remote")
  .option("--all").option("--replace", "discard local uncommitted changes in the target (a backup ref is kept)").option("--keep-remote", "leave the handoff on the remote").option("--dry-run")
  .action(async (names, o) => { const share = open(); const h = await H();
    await ui.command("cs resume", async () => { const projects = h.projectsFor(share, names, o.all);
      const { runShareSync } = await import("./sharesync.js"); await ui.group("share pulled", () => runShareSync(share, { pullOnly: true, timeout: 10 }), { done: "up to date" });
      process.exitCode = await ui.group("resumed", () => h.resume(share, projects, { replace: o.replace, keepRemote: o.keepRemote, dryRun: o.dryRun }), { done: "no handoffs waiting" }); },
      { outro: () => (process.exitCode ? ui.red("some handoffs not applied — see above") : ui.dim("carry on: claude")) }); });
const handoffs = program.command("handoffs", HIDDEN).description("handoffs waiting on remotes: ls | gc | drop");
handoffs.command("ls", { isDefault: true }).option("--all").action(async (o) => { const share = open(); const h = await H(); const projects = h.projectsFor(share, [], o.all ?? true);
  ui.intro("cs handoffs"); const list = await h.waitingList(share, projects);
  if (!list.length) ui.info(ui.dim("no handoffs waiting")); else ui.table(list.map((x) => [x.project, x.branch, x.machine, x.when.slice(0, 16), ui.dim(x.note)]), ["project", "branch", "from", "when", "note"]);
  ui.outro(ui.dim("cs sync · cs handoffs gc --older-than 14")); });
handoffs.command("gc").option("--older-than <days>", "", "14").option("--all").action(async (o) => { const share = open(); const h = await H(); await ui.command("cs handoffs gc", async () => ui.group("dropped", () => h.handoffGc(share, h.projectsFor(share, [], true), +o.olderThan), { done: "nothing older than that" })); });
handoffs.command("drop <branch>").description("delete one waiting handoff (branch name or full ref) for the cwd project").action(async (b) => { const share = open(); const h = await H(); const [p] = h.projectsFor(share, [], false); await ui.command("cs handoffs drop", () => h.handoffDrop(share, p, b)); });
program.command("note", HIDDEN).description("print (once) the note of the last handoff applied for the cwd project").option("--print").action(async () => { const share = open(); const h = await H(); if (!h.printNote(share)) process.exitCode = 1; });

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

async function main() {
  platform.refuseUnsupported();
  process.stdout.on("error", (e: any) => { if (e?.code === "EPIPE") process.exit(0); throw e; });
  const argv = process.argv.slice(2);
  // `cs new foo --personal` → `--identity personal` (identity id or GitHub owner)
  if (argv[0] === "new" && machineExists()) { try { const share = open(); const { rewriteIdentityFlags } = await import("./projects.js"); process.argv = [...process.argv.slice(0, 2), ...rewriteIdentityFlags(argv, share.manifest)]; } catch {} }
  // bare `cs` (hidden --no-fetch for scripts): the status view
  if (argv.every((a) => a === "--no-fetch")) { if (!machineExists()) program.help(); const share = open(); await (await import("./status.js")).runBare(share, !argv.length); return; }
  const cmdName = argv.find((a) => !a.startsWith("-"));
  const wantsCheck = !["update", "ui-demo"].includes(cmdName ?? "") && !argv.includes("-q") && !argv.includes("--quiet");
  const finishCheck = wantsCheck ? await startUpdateCheck() : async () => 0;
  try { await program.parseAsync(process.argv); }
  catch (e: any) { if (e?.handled) { process.exitCode = e.code ?? 1; return; } const msg: string = e?.message ?? String(e); if (msg.startsWith("cs: ")) { const [what, ...rest] = msg.slice(4).split("\n"); ui.error(what, rest.join("\n").trim()); process.exitCode = 1; } else throw e; }
  finally { const hint = behindHint(await behindCount(finishCheck)); if (hint) console.error(ui.yellow("!") + " " + hint); }
}
main();
