/** cs init — wizard (no args) or flag-driven. Join/create a share via a per-machine master key. */
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import * as git from "./git.js";
import * as github from "./github.js";
import * as master from "./master.js";
import { contract, expand, home, repoDirDefault, templatesDir } from "./paths.js";
import * as platform from "./platform.js";
import { loadMachine, machineExists, saveMachine, type Machine } from "./config.js";
import { checkoutRoot, loadManifest, NAME_RE, selectedProjects, workspace, type Manifest, type Project } from "./manifest.js";
import { runApply } from "./apply.js";
import { runLink } from "./link.js";
import { runDoctor } from "./doctor.js";
import { runDeps } from "./deps.js";
import * as identity from "./identity.js";
import * as ui from "./ui.js";

export const CONFIG_REPO_NAME = "claude-share-config";
export const PHASES = ["deps", "repo", "ssh", "apply", "link", "secrets", "hooks", "doctor"];
const owner = (v: string) => (/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(v) ? undefined : "a GitHub login, e.g. octocat");
const email = (v: string) => (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? undefined : "not an email address");
const name = (v: string) => (NAME_RE.test(v) ? undefined : "letters, digits, . _ - only");

export function newConfigRepo(dest: string, branch = "master"): string {
  const src = templatesDir() + "/config-repo"; mkdirSync(dest, { recursive: true });
  const copy = (d: string) => { for (const e of readdirSync(d, { withFileTypes: true })) { const f = join(d, e.name), t = join(dest, relative(src, f)); if (e.isDirectory()) { mkdirSync(t, { recursive: true }); copy(f); } else if (!existsSync(t)) { mkdirSync(dirname(t), { recursive: true }); copyFileSync(f, t); } } };
  copy(src);
  for (const d of ["plans", "projects", "secrets", "claude/skills", "claude/rules", "claude/agents", "machines"]) { mkdirSync(join(dest, d), { recursive: true }); if (!readdirSync(join(dest, d)).length) writeFileSync(join(dest, d, ".gitkeep"), ""); }
  if (!git.isRepo(dest)) git.git(["init", "-q", "-b", branch], dest);
  git.git(["add", "-A"], dest); if (git.isDirty(dest) || !git.out(["rev-parse", "--verify", "-q", "HEAD"], dest)) git.commit(dest, "claude-share config skeleton");
  return dest;
}

async function accessLoop(sshUrl: string, gh: [string, string] | undefined, interactive: boolean, machine: string) {
  const { pub, created } = master.ensureKey(machine); if (created) ui.step(`master key generated  ${ui.dim(master.KEY)}`);
  let [ok, err] = await ui.spin("checking access to the config repo…", async () => master.canAccess(sshUrl));
  let tries = 0;
  while (!ok) { master.instructions(pub, gh, machine); if (!interactive) throw new Error("cs: config repo not reachable with the master key (see instructions above)");
    if (!(await ui.proceed("added the key?", "Done — check access", "Abort")) || tries++ >= 10) throw new Error("cs: aborted — config repo not reachable");
    [ok, err] = await ui.spin("checking access…", async () => master.canAccess(sshUrl)); if (!ok) ui.warn(`still no access — ${err}`); }
  ui.step("config repo reachable with the master key");
}
async function cloneConfig(sshUrl: string, target: string) {
  mkdirSync(dirname(target), { recursive: true });
  await ui.spin("cloning the config repo…", async () => git.git(["clone", "-q", sshUrl, target], undefined, { sshKey: master.keyPath() }));
  master.configureRepo(target); ui.step(`config repo cloned to ${ui.dim(contract(target))}`);
}
async function askUrl(prompt: string): Promise<[string, [string, string] | undefined]> {
  for (;;) {
    const raw = await ui.text(prompt, { placeholder: "https://github.com/<owner>/claude-share-config", validate: (v) => (v.trim() ? undefined : "a URL is required") });
    const [sshUrl, gh] = master.parseRepoUrl(raw);
    if (gh) { const vis = await ui.spin("looking up the repository…", async () => master.isPublic(master.httpsUrl(...gh)));
      if (vis === true) ui.step(`${gh[0]}/${gh[1]} found (public)`); else if (vis === false) ui.step(`${gh[0]}/${gh[1]} found (private) — access via the master key`);
      else { ui.warn(`${gh[0]}/${gh[1]} not found or unreachable`); if (!(await ui.confirm("use this URL anyway?", false))) continue; } }
    return [sshUrl, gh];
  }
}
async function join_(target: string, interactive: boolean, machine: string, repoUrl = "") {
  if (existsSync(target) && git.isRepo(target)) { ui.skip(`config repo already at ${contract(target)}`); master.configureRepo(target); return; }
  const [sshUrl, gh] = repoUrl ? master.parseRepoUrl(repoUrl) : await askUrl("config repo URL");
  await accessLoop(sshUrl, gh, interactive, machine); await cloneConfig(sshUrl, target);
}
async function create(target: string, interactive: boolean, machine: string) {
  const n = await ui.text("name for your new config repo", { default: CONFIG_REPO_NAME, validate: name });
  ui.note([ui.cyan("https://github.com/new"), ui.dim("no README, no .gitignore, no license — completely empty")], `Create an empty PRIVATE repository named '${n}' on GitHub`);
  const [sshUrl, gh] = await askUrl("paste the new repo's URL"); await accessLoop(sshUrl, gh, interactive, machine);
  newConfigRepo(target); if (!git.remoteUrl(target)) git.git(["remote", "add", "origin", sshUrl], target); master.configureRepo(target);
  await ui.spin("pushing the initial config repo…", async () => git.git(["push", "-q", "-u", "origin", git.currentBranch(target)], target)); ui.step(`config repo initialized and pushed  ${ui.dim(sshUrl)}`);
}
async function machineName(existingName: string, interactive: boolean): Promise<string> {
  if (machineExists()) return existingName || loadMachine().name;
  if (existingName) return existingName;
  if (!interactive) throw new Error("cs: --name <machine-name> is required");
  const dflt = { wsl2: "desktop", macos: "laptop" }[platform.describe() as string] ?? "machine";
  return ui.text("What should this machine be called?", { default: dflt, placeholder: "desktop-work, laptop, …", validate: name });
}
async function machinePhase(repo: string, nm: string, profiles: string[], ws: string | undefined, interactive: boolean): Promise<Machine> {
  if (machineExists()) { const m = loadMachine(); let changed = false;
    if (nm && m.name !== nm) { m.name = nm; changed = true; } if (profiles.length && JSON.stringify(m.profiles) !== JSON.stringify(profiles)) { m.profiles = profiles; changed = true; } if (ws && m.workspace !== ws) { m.workspace = ws; changed = true; }
    if (changed) { saveMachine(m); ui.step("machine settings updated"); } else ui.skip(`machine ${m.name}  ${m.profiles.join(", ")}`); return m; }
  const md = join(repo, "machines"); const existing = existsSync(md) ? readdirSync(md, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== "recovery").map((d) => d.name).sort() : [];
  if (existing.length) ui.step(`machines already in this share: ${existing.map((x) => ui.bold(x)).join(", ")}`);
  while (existing.includes(nm)) {
    if (!interactive) throw new Error(`cs: machine '${nm}' already exists in the share`);
    if (await ui.confirm(`'${nm}' already exists — re-use it (its published keys will be replaced)?`, false)) break;
    nm = await ui.text("name for this machine", { validate: name });
  }
  let exclude: string[] = [];
  if (!profiles.length) {
    let projects: Project[] = []; try { projects = Object.values(loadManifest(repo).projects); } catch {}
    if (interactive && projects.length) {
      const groups: Record<string, { value: string; label: string; hint?: string }[]> = {};
      for (const p of projects) { const g = p.profiles.includes("all") ? "every machine" : p.profiles.join(", "); (groups[g] ??= []).push({ value: p.name, label: p.name, hint: p.kind === "git" ? `${p.identity} · ${p.url?.replace(/^git@github\.com:/, "").replace(/\.git$/, "")}` : p.kind }); }
      const names = new Set(projects.map((p) => p.name));
      let picked = new Set<string>(); let initial = projects.map((p) => p.name);
      for (;;) {
        picked = new Set((await ui.groupMultiselect("Which projects should this machine clone and sync?", groups, initial)).filter((v) => names.has(v)));
        const lines = projects.map((p) => (picked.has(p.name) ? ui.green("✓ ") + p.name : ui.dim("○ " + p.name + "  (not on this machine)")));
        ui.note(lines, `${picked.size} of ${projects.length} projects`);
        if (await ui.proceed("proceed with this selection?", "Yes, continue", "Change selection")) break;
        initial = [...picked];
      }
      profiles = [...new Set(projects.filter((p) => picked.has(p.name)).flatMap((p) => p.profiles).filter((x) => x !== "all"))].sort();
      if (!profiles.length) profiles = ["personal"];
      exclude = projects.filter((p) => !picked.has(p.name) && (p.profiles.includes("all") || p.profiles.some((x) => profiles.includes(x)))).map((p) => p.name);
    } else if (interactive) profiles = (await ui.text("profiles for this machine (comma list — project groups it should get)", { default: "personal" })).split(",").map((x) => x.trim()).filter(Boolean);
    else profiles = ["personal"];
  }
  let workspaceOverride = ws;
  if (ws === undefined && interactive) {
    let dws = "~/dev"; try { dws = loadManifest(repo).workspaceRoot; } catch {}
    const choice = await ui.select("Where should your projects live on this machine?", [
      { value: "default", label: `${dws}  (recommended)`, hint: existsSync(expand(dws)) ? "exists" : "will be created" },
      { value: "custom", label: "Somewhere else…", hint: "any absolute path or ~/…" },
    ]);
    let w = dws;
    if (choice === "custom") {
      w = await ui.text("project root", { default: dws, validate: (v) => (v.startsWith("~") || v.startsWith("/") ? undefined : "use an absolute path or ~/…") });
      if (w.startsWith(home() + "/")) w = "~/" + w.slice(home().length + 1);
      if (platform.isWSL() && expand(w).startsWith("/mnt/")) { ui.warn("that is the Windows filesystem — git and Claude are far slower there; ~/dev inside WSL is recommended"); if (!(await ui.confirm("use it anyway?", false))) w = dws; }
    }
    const existed = existsSync(expand(w)); mkdirSync(expand(w), { recursive: true });
    ui.step(`projects live in ${ui.bold(w)}${existed ? "" : ui.dim("  (created)")}`);
    workspaceOverride = w === dws ? undefined : w;
  } else if (ws) mkdirSync(expand(ws), { recursive: true });
  const m: Machine = { name: nm, profiles, exclude, workspace: workspaceOverride, secretsBackend: "sops" }; saveMachine(m);
  return m;
}
async function firstIdentity(repo: string, m: Machine, interactive: boolean) {
  const man = loadManifest(repo); if (Object.keys(man.identities).length) return;
  if (!interactive) { ui.warn("no identities yet — add one with cs identity add <id> --owner <owner> --name .. --email .."); return; }
  ui.section("first identity"); ui.info("an identity = a GitHub owner (your login or an org) + the name and email you commit with there");
  const id = await ui.text("identity id", { default: "personal", validate: name }); const own = await ui.text("GitHub owner (your login or an org)", { validate: owner });
  const nm = await ui.text("git user.name", { validate: (v) => (v ? undefined : "required") }); const em = await ui.text("git user.email", { validate: email });
  await identity.add(repo, m, man, id, { owner: own, name: nm, email: em, noToken: true });
}
async function keysAndTokens(repo: string, m: Machine, interactive: boolean, skip: string[]) {
  const full = loadManifest(repo); if (!Object.keys(full.identities).length) return;
  // only the identities the selected projects actually use (all of them when nothing is selected yet, e.g. a new share)
  const used = new Set(selectedProjects(full, m).map((p) => p.identity).filter(Boolean));
  const man: Manifest = used.size ? { ...full, identities: Object.fromEntries(Object.entries(full.identities).filter(([id]) => used.has(id))) } : full;
  const skipped = Object.keys(full.identities).filter((id) => !(id in man.identities));
  if (skipped.length) ui.skip(`identities not needed by the selected projects: ${skipped.join(", ")}`);
  if (!skip.includes("ssh")) { ui.section("identity ssh keys"); const ssh = await import("./ssh.js"); let rc = await ssh.setup(repo, m, man); let tries = 0;
    while (rc !== 0 && interactive && tries++ < 5) { if (!(await ui.proceed("added the key(s) on GitHub?", "Done — verify", "Skip for now"))) break; rc = await ssh.setup(repo, m, man, true); } }
  if (interactive) { const missing = Object.values(man.identities).filter((i) => i.owner && !github.getToken(i.owner));
    if (missing.length) { ui.section("GitHub tokens"); ui.info("a token per owner lets cs new --<id> create repos — optional now, cs token set <owner> later");
      for (const i of missing) if (await ui.confirm(`store a token for ${i.owner} (identity ${i.id}) now?`, false)) { try { await github.ensureToken(i.owner); ui.ok(`token for ${i.owner} stored`); } catch (e: any) { ui.warn(e.message); } } } }
}
function push(repo: string) {
  if (!git.remoteUrl(repo)) return; const ab = git.aheadBehind(repo);
  if (ab === undefined || ab[0]) { const r = git.git(["push", "-q", "-u", "origin", git.currentBranch(repo)], repo, { check: false, timeout: 60 }); r.code === 0 ? ui.ok("config repo pushed") : ui.fail(`push failed: ${r.err}`); }
}
async function finish(repo: string, m: Machine, interactive: boolean, skip: string[]): Promise<number> {
  const man = loadManifest(repo);
  if (!skip.includes("apply")) await ui.group("~/.claude applied", () => runApply(repo, m, man), { done: "already up to date" });
  if (!skip.includes("link")) await ui.group("project files linked", () => runLink(repo, m, man), { done: "already in sync" });
  if (!skip.includes("secrets") && m.secretsBackend !== "none") await ui.group("secrets", async () => (await import("./secretscmd.js")).init(repo, m, interactive));
  if (!skip.includes("hooks")) await ui.group("automatic sync", async () => { (await import("./hooks.js")).runHooks(repo, m, "install"); runApply(repo, m, loadManifest(repo)); });
  await ui.group("config repo", () => push(repo), { done: "nothing to push" });
  let rc = 0; if (!skip.includes("doctor")) rc = await ui.group("doctor", () => runDoctor(repo, m, man, false, true), { done: "all checks passed" });
  const ws = workspace(man, m); const missing = selectedProjects(man, m).filter((p) => p.kind !== "local" && !existsSync(checkoutRoot(p, ws)));
  if (missing.length && interactive && (await ui.confirm(`clone ${missing.length} project(s) now (${missing.slice(0, 6).map((p) => p.name).join(", ")}${missing.length > 6 ? "…" : ""})?`, true))) await ui.group(`clone ${missing.length} project(s)`, async () => (await import("./projects.js")).clone(repo, m, man, []));
  const rcFile = platform.shellRc().split("/").pop();
  ui.note([`${ui.bold("open a new terminal")} ${ui.dim(`(or: source ~/${rcFile})`)} — that gives you ${ui.bold("cs")} on PATH and the ${ui.bold("claude")} wrapper`,
    `${ui.bold("claude")}  ${ui.dim("log in once on this machine")}`, `${ui.bold("cs status")}  ${ui.dim("dashboard")}`, `${ui.bold("cs new <project> --<identity>")}  ${ui.dim("start something")}`], "next");
  ui.outro(ui.bold("done"));
  return rc;
}
export interface InitOpts { repo?: string; owner?: string; name?: string; profiles?: string[]; skip?: string[]; workspace?: string; interactive?: boolean; key?: string; installDeps?: boolean }
export async function init(o: InitOpts): Promise<number> {
  const skip = o.skip ?? []; for (const x of skip) if (!PHASES.includes(x)) throw new Error(`cs: unknown phase '${x}' (phases: ${PHASES.join(", ")})`);
  const interactive = o.interactive ?? (ui.isTTY() || ui.isScripted()); const target = repoDirDefault();
  const localSrc = o.repo && !/:\/\/|^git@/.test(o.repo) ? expand(o.repo) : undefined;
  ui.intro("claude-share setup");
  if (!skip.includes("deps")) await ui.group("prerequisites", () => runDeps(o.installDeps, true));
  const nm = await machineName(o.name ?? "", interactive);
  const already = existsSync(target) && git.isRepo(target);
  if (already) { ui.skip(`config repo already at ${contract(target)}`); if (git.remoteUrl(target)) master.configureRepo(target); }
  else if (!skip.includes("repo")) {
    if (localSrc) { if (!(git.isRepo(localSrc) || git.isBare(localSrc))) throw new Error(`cs: ${localSrc} is not a git repo`); mkdirSync(dirname(target), { recursive: true }); git.git(["clone", "-q", localSrc, target]); ui.ok(`config repo cloned from ${contract(localSrc)}`); }
    else if (o.repo) { const [sshUrl, gh] = master.parseRepoUrl(o.repo);
      if (o.key) { mkdirSync(dirname(target), { recursive: true }); git.git(["clone", "-q", sshUrl, target], undefined, { sshKey: expand(o.key) }); git.git(["config", "core.sshCommand", `ssh -i ${contract(expand(o.key))} -o IdentitiesOnly=yes`], target); }
      else { await accessLoop(sshUrl, gh, interactive, nm); await cloneConfig(sshUrl, target); } }
    else if (o.owner) { const token = await github.ensureToken(o.owner, interactive); const url = `git@github.com:${o.owner}/${CONFIG_REPO_NAME}.git`;
      if (await github.ensureRepo(o.owner, CONFIG_REPO_NAME, token, true, "claude-share config (private)")) { ui.ok(`created private repo ${o.owner}/${CONFIG_REPO_NAME}`); newConfigRepo(target); git.git(["remote", "add", "origin", url], target); await accessLoop(url, [o.owner, CONFIG_REPO_NAME], interactive, nm); master.configureRepo(target); }
      else { await accessLoop(url, [o.owner, CONFIG_REPO_NAME], interactive, nm); await cloneConfig(url, target); } }
    else if (interactive) { const choice = await ui.select("What would you like to do?", [{ value: "join", label: "Join an existing share", hint: "you already have a config repo (from another machine)" }, { value: "create", label: "Create a new share", hint: "first machine, no config repo yet" }]);
      if (choice === "create") await create(target, true, nm); else await join_(target, true, nm); }
    else throw new Error("cs: pass --repo <url|path> or --owner <github-owner>, or run cs init in a terminal");
  }
  const m = await machinePhase(target, nm, o.profiles ?? [], o.workspace, interactive);
  await firstIdentity(target, m, interactive); await keysAndTokens(target, m, interactive, skip);
  return finish(target, m, interactive, skip);
}
