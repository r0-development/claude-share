/** cs add / cs clone / cs new — and the shared "ensure remote" step they and `cs doctor --fix` use (ADR-0001). */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import * as git from "./git.js";
import * as github from "./github.js";
import { contract, expand } from "./paths.js";
import type { Machine } from "./config.js";
import { appendProject, checkoutRoot, container, identityForUrl, keyPath, loadManifest, NAME_RE, selectedProjects, updateProject, validate, workspace, type Identity, type Manifest, type Project } from "./manifest.js";
import { runLink } from "./link.js";
import * as ui from "./ui.js";

/** Set the per-repo git identity when the includeIf rules do not resolve to the expected one. */
function ensureIdentity(root: string, ident: Identity, hasRemote: boolean) {
  const email = git.configGet(root, "user.email"); if (email === ident.email) return;
  if (hasRemote) ui.warn(`git identity resolved to '${email || "UNSET"}' (expected ${ident.email}); setting it per-repo. Run cs apply to fix globally.`); else ui.info(`git identity set per-repo (${ident.email})`);
  git.git(["config", "user.name", ident.name], root); git.git(["config", "user.email", ident.email], root); git.git(["config", "core.sshCommand", `ssh -i ${contract(expand(keyPath(ident)))} -o IdentitiesOnly=yes`], root);
}

/** Make `root` a git repo with an origin remote under the identity's owner: init, create the private GitHub repo,
 *  first commit, push -u. Idempotent. Returns the remote url, or undefined when it could not be done (reason printed). */
export async function ensureRemote(root: string, name: string, ident: Identity, branch: string, o: { priv?: boolean; description?: string } = {}): Promise<string | undefined> {
  mkdirSync(root, { recursive: true });
  if (!git.isRepo(root)) { git.git(["init", "-q", "-b", branch], root); ui.step(`git init -b ${branch}`); }
  branch = git.currentBranch(root) || branch;
  let url = git.remoteUrl(root);
  if (!url) {
    if (!ident.owner) { ui.fail(`identity '${ident.id}' has no owner in projects.toml — cannot create a repo for ${name}`); return undefined; }
    url = github.repoUrl(ident.owner, name);
    try { const token = await github.ensureToken(ident.owner);
      const created = await ui.spin(`creating ${ident.owner}/${name} on GitHub…`, () => github.ensureRepo(ident.owner, name, token, o.priv !== false, o.description ?? ""));
      created ? ui.step(`github: created ${ident.owner}/${name}  ${ui.dim(o.priv !== false ? "private" : "public")}`) : ui.skip(`github: ${ident.owner}/${name} already exists`);
    } catch (e: any) { ui.fail(e.message); if (String(e.message).includes(" 403")) ui.info("fine-grained token needs: Repository access = All repositories, Administration = Read and write (edit the token on GitHub)"); return undefined; }
    git.git(["remote", "add", "origin", url], root); ui.step(`remote origin  ${ui.dim(url)}`);
  }
  ensureIdentity(root, ident, true);
  if (!git.out(["rev-parse", "--verify", "-q", "HEAD"], root)) {
    if (!existsSync(join(root, "README.md"))) writeFileSync(join(root, "README.md"), `# ${name}\n\n${o.description ?? ""}`.trimEnd() + "\n");
    if (!existsSync(join(root, ".gitignore"))) writeFileSync(join(root, ".gitignore"), ".DS_Store\n*:Zone.Identifier\n.env\n.env.*\n!.env.example\n");
    git.git(["add", "-A"], root); git.commit(root, "init", ident.name, ident.email); ui.step(`first commit on ${branch}  ${ui.dim(`${ident.name} <${ident.email}>`)}`);
  }
  if (!git.aheadBehind(root)) {
    const r = await ui.spin(`pushing ${branch}…`, () => git.gitA(["push", "-q", "-u", "origin", branch], root, { check: false, timeout: 60 }));
    if (r.code !== 0) { ui.fail(r.err.split("\n").pop() ?? "push failed"); return undefined; } ui.step(`pushed ${branch}  ${ui.dim(url)}`);
  }
  return url.includes("github") ? git.canonicalGithub(url) : url;
}

/** Which identity a new remote should be created under: --identity, the only one, or a question. */
export async function chooseIdentity(man: Manifest, flag: string | undefined, forWhat: string): Promise<Identity> {
  const ids = Object.values(man.identities); if (!ids.length) throw new Error("cs: no identities yet — cs identity add <id> --owner <owner> --name .. --email ..");
  if (flag) { const i = man.identities[flag] ?? ids.find((x) => x.owner.toLowerCase() === flag.toLowerCase()); if (!i) throw new Error(`cs: unknown identity '${flag}'`); return i; }
  if (ids.length === 1) return ids[0];
  if (!ui.canAsk()) throw new Error(`cs: which identity for ${forWhat}? pass --identity <id> (one of ${ids.map((i) => i.id).join(", ")})`);
  const id = await ui.select(`Which identity (GitHub owner) should ${forWhat} live under?`, ids.map((i) => ({ value: i.id, label: i.id, hint: `github.com/${i.owner} · ${i.name} <${i.email}>` })));
  return man.identities[id];
}

/** cs add [path]: register an existing directory; creates the remote first when it has none. */
export async function add(repo: string, m: Machine, man: Manifest, path: string | undefined, o: { profiles: string[]; identity?: string; name?: string; description: string; noCommit: boolean; priv?: boolean }): Promise<Project> {
  const ws = workspace(man, m); let target = resolve(path ?? process.cwd()); let layout: Project["layout"] = "plain";
  const top = git.toplevel(target);
  if (top) { target = top; if (basename(top) === "repo" && dirname(top) !== ws) { target = dirname(top); layout = "worktrees"; } }
  const rel = relative(ws, target); if (!rel || rel.startsWith("..") || rel.includes("/")) throw new Error(`cs: project must be a direct child of the workspace ${contract(ws)} (got ${target})`);
  const name = o.name ?? rel; const checkout = layout === "worktrees" ? join(target, "repo") : target;
  if (man.projects[name]) throw new Error(`cs: project '${name}' is already registered (edit projects.toml to change it)`);
  let url = git.remoteUrl(checkout); let ident: Identity | undefined;
  if (!url) { ident = await chooseIdentity(man, o.identity, name); const made = await ensureRemote(checkout, name, ident, git.currentBranch(checkout) || man.defaultBranch, { priv: o.priv, description: o.description }); if (!made) throw new Error(`cs: ${name} still has no remote`); url = made; }
  else { if (url.includes("github")) url = git.canonicalGithub(url); ident = o.identity ? man.identities[o.identity] : identityForUrl(man, url); if (!ident) throw new Error(`cs: no identity matches ${url}; pass --identity or add url_globs in projects.toml`); }
  const p: Project = { name, path: rel !== name ? rel : undefined, url, identity: ident.id, profiles: o.profiles.length ? o.profiles : ["all"], machines: [], branch: git.currentBranch(checkout), layout, description: o.description, handoff: {} };
  const errs = validate({ ...man, projects: { [name]: p } }); if (errs.length) throw new Error("cs: " + errs.join("; "));
  appendProject(repo, p); ui.ok(`registered ${name}  ${ui.dim(`${url} · profiles ${p.profiles.join(",")}`)}`);
  if (!o.noCommit && git.isRepo(repo)) { git.git(["add", "projects.toml"], repo); git.commit(repo, `projects: add ${name}`, "cs", `cs@${m.name}`); }
  ui.setQuiet(true); try { runLink(repo, m, loadManifest(repo), [name]); } finally { ui.setQuiet(false); }
  return p;
}

/** Give a registered project that has no remote one (cs doctor --fix): create, push, record url/identity/branch. */
export async function fixRemote(repo: string, m: Machine, man: Manifest, p: Project, identityFlag?: string): Promise<boolean> {
  const root = checkoutRoot(p, workspace(man, m));
  const ident = p.identity && man.identities[p.identity] ? man.identities[p.identity] : await chooseIdentity(man, identityFlag, p.name);
  const url = await ensureRemote(root, p.name, ident, git.currentBranch(root) || p.branch || man.defaultBranch); if (!url) return false;
  updateProject(repo, { ...p, url, identity: ident.id, branch: git.currentBranch(root) || p.branch });
  if (git.isRepo(repo)) { git.git(["add", "projects.toml"], repo); git.commit(repo, `projects: ${p.name} remote`, "cs", `cs@${m.name}`); }
  ui.ok(`${p.name}: remote recorded  ${ui.dim(url)}`); return true;
}

export async function clone(repo: string, m: Machine, man: Manifest, names: string[], dryRun = false): Promise<number> {
  const ws = workspace(man, m); let rc = 0; const cloned: string[] = [];
  for (const p of selectedProjects(man, m)) {
    if (names.length && !names.includes(p.name)) continue;
    const root = checkoutRoot(p, ws), cont = container(p, ws);
    if (existsSync(root)) { if (git.isRepo(root) && p.url && git.remoteUrl(root) && git.canonicalGithub(git.remoteUrl(root)) !== git.canonicalGithub(p.url)) { ui.fail(`${p.name}: exists with a different remote (${git.remoteUrl(root)}); not touching it`); rc = 1; } continue; }
    if (!p.url) { ui.warn(`${p.name}: no remote recorded — cannot clone it here (on the machine that has it: cs doctor --fix)`); rc = 1; continue; }
    if (dryRun) { ui.step(`${p.name}: would clone ${p.url} → ${contract(root)}`); continue; }
    mkdirSync(cont, { recursive: true });
    let r = await ui.spin(`cloning ${p.name}…`, () => git.gitA(["clone", "-q", ...(p.branch ? ["-b", p.branch] : []), p.url!, root], undefined, { check: false }));
    let note = "";
    if (r.code !== 0 && p.branch && /Remote branch .* not found/.test(r.err)) {
      r = await ui.spin(`cloning ${p.name} (default branch)…`, () => git.gitA(["clone", "-q", p.url!, root], undefined, { check: false }));
      if (r.code === 0) { note = ui.yellow(` (branch '${p.branch}' not on remote — got '${git.currentBranch(root)}', fix projects.toml)`); }
    }
    if (r.code !== 0) { ui.fail(`${p.name}: ${r.err.split("\n").pop()}`); rc = 1; continue; }
    ui.step(`${p.name} → ${contract(root)}${p.layout === "worktrees" ? ui.dim(" (worktree layout)") : ""}${note}`);
    const ident = p.identity ? man.identities[p.identity] : undefined; const email = git.configGet(root, "user.email");
    if (ident && email !== ident.email) { ui.warn(`${p.name}: user.email resolved to '${email || "UNSET"}' — setting per-repo identity as fallback`); git.git(["config", "user.name", ident.name], root); git.git(["config", "user.email", ident.email], root); }
    if (p.postClone) spawnSync("bash", ["-lc", p.postClone], { cwd: cont, stdio: "inherit" });
    cloned.push(p.name);
  }
  if (cloned.length) { const wasQuiet = ui.isQuiet(); ui.setQuiet(true); try { runLink(repo, m, man, cloned); } finally { ui.setQuiet(wasQuiet); } ui.step(`project state placed into ${cloned.length} project(s)`); }
  return rc;
}

/** cs new <name>: empty directory → git repo with a private GitHub remote, registered, project state placed. */
export async function create(repo: string, m: Machine, man: Manifest, name: string, ident: Identity, o: { profiles: string[]; description?: string; priv?: boolean }): Promise<number> {
  if (!NAME_RE.test(name)) throw new Error(`cs: '${name}' is not a valid project name`);
  if (man.projects[name]) throw new Error(`cs: project '${name}' is already registered`);
  const ws = workspace(man, m), root = join(ws, name), branch = man.defaultBranch;
  ui.intro(`new project ${ui.bold(name)}`);
  ui.kv("identity", `${ident.id}  ${ui.dim(`${ident.name} <${ident.email}>`)}`); ui.kv("path", contract(root)); ui.kv("remote", github.repoUrl(ident.owner, name)); ui.kv("branch", branch); ui.kv("profiles", o.profiles.join(", "));
  const url = await ensureRemote(root, name, ident, branch, { priv: o.priv, description: o.description }); if (!url) return 1;
  const p: Project = { name, url, identity: ident.id, profiles: o.profiles, machines: [], branch: git.currentBranch(root) || branch, layout: "plain", description: o.description, handoff: {} };
  appendProject(repo, p); if (git.isRepo(repo)) { git.git(["add", "projects.toml"], repo); git.commit(repo, `projects: add ${name}`, "cs", `cs@${m.name}`); }
  ui.step(`registered in projects.toml  ${ui.dim(`profiles ${o.profiles.join(",")}`)}`);
  ui.setQuiet(true); try { runLink(repo, m, loadManifest(repo), [name]); } finally { ui.setQuiet(false); }
  ui.step("project state placed (memory → share)");
  ui.outro(ui.bold(`cd ${contract(root)} && claude`));
  return 0;
}
