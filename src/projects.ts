/** cs add / cs clone / cs new. */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import * as git from "./git.js";
import * as github from "./github.js";
import { contract } from "./paths.js";
import type { Machine } from "./config.js";
import { appendProject, checkoutRoot, container, identityForUrl, keyPath, loadManifest, NAME_RE, selectedProjects, validate, workspace, type Identity, type Manifest, type Project } from "./manifest.js";
import { runLink } from "./link.js";
import * as ui from "./ui.js";
import { expand } from "./paths.js";

export function add(repo: string, m: Machine, man: Manifest, path: string | undefined, o: { kind?: string; profiles: string[]; identity?: string; name?: string; description: string; noCommit: boolean }): Project {
  const ws = workspace(man, m); let target = resolve(path ?? process.cwd()); let layout: Project["layout"] = "plain";
  const top = o.kind !== "local" ? git.toplevel(target) : undefined;
  if (top) { target = top; if (basename(top) === "repo" && dirname(top) !== ws) { target = dirname(top); layout = "worktrees"; } }
  const rel = relative(ws, target); if (!rel || rel.startsWith("..") || rel.includes("/")) throw new Error(`cs: project must be a direct child of the workspace ${contract(ws)} (got ${target})`);
  const name = o.name ?? rel; const checkout = layout === "worktrees" ? join(target, "repo") : target;
  let kind = o.kind ?? (git.isRepo(checkout) && git.remoteUrl(checkout) ? "git" : git.isRepo(checkout) ? "git" : "synced"); let url = "", branch = "", identity = o.identity ?? "";
  if (kind === "git") {
    url = git.remoteUrl(checkout); if (!url) throw new Error(`cs: ${checkout} has no origin remote; use --kind synced or push it first`);
    if (url.includes("github")) url = git.canonicalGithub(url); branch = git.currentBranch(checkout);
    if (!identity) { const i = identityForUrl(man, url); if (!i) throw new Error(`cs: no identity matches ${url}; pass --identity or add url_globs in projects.toml`); identity = i.id; }
  }
  const p: Project = { name, kind: kind as any, path: rel !== name ? rel : undefined, url, identity, profiles: o.profiles.length ? o.profiles : ["all"], machines: [], branch, layout, description: o.description, handoff: {}, sync: {} };
  const errs = validate({ ...man, projects: { [name]: p } }); if (errs.length) throw new Error("cs: " + errs.join("; "));
  appendProject(repo, p); ui.ok(`registered ${name} (${kind}${url ? ", " + url : ""}) profiles=${p.profiles.join(",")}`);
  if (!o.noCommit && git.isRepo(repo)) { git.git(["add", "projects.toml"], repo); git.commit(repo, `projects: add ${name}`, "cs", `cs@${m.name}`); }
  return p;
}
export async function clone(repo: string, m: Machine, man: Manifest, names: string[], dryRun = false): Promise<number> {
  const ws = workspace(man, m); let rc = 0; const cloned: string[] = [];
  for (const p of selectedProjects(man, m)) {
    if (names.length && !names.includes(p.name)) continue;
    const root = checkoutRoot(p, ws), cont = container(p, ws);
    if (existsSync(root)) { if (p.kind === "git" && git.isRepo(root) && p.url && git.canonicalGithub(git.remoteUrl(root)) !== git.canonicalGithub(p.url)) { ui.fail(`${p.name}: exists with a different remote (${git.remoteUrl(root)}); not touching it`); rc = 1; } continue; }
    if (p.kind === "local") { ui.info(`${p.name}: local-only, skipped`); continue; }
    if (p.kind === "synced") { if (dryRun) { ui.step(`${p.name}: would ${p.url ? "clone" : "create"} ${contract(root)}`); continue; }
      await ui.spin(`${p.name}…`, async () => { if (p.url) git.git(["clone", "-q", p.url, root]); else mkdirSync(root, { recursive: true }); }); ui.step(`${p.name} → ${contract(root)}`); cloned.push(p.name); continue; }
    if (dryRun) { ui.step(`${p.name}: would clone ${p.url} → ${contract(root)}`); continue; }
    mkdirSync(cont, { recursive: true });
    let r = await ui.spin(`cloning ${p.name}…`, async () => git.git(["clone", "-q", ...(p.branch ? ["-b", p.branch] : []), p.url!, root], undefined, { check: false }));
    let note = "";
    if (r.code !== 0 && p.branch && /Remote branch .* not found/.test(r.err)) {
      r = await ui.spin(`cloning ${p.name} (default branch)…`, async () => git.git(["clone", "-q", p.url!, root], undefined, { check: false }));
      if (r.code === 0) { note = ui.yellow(` (branch '${p.branch}' not on remote — got '${git.currentBranch(root)}', fix projects.toml)`); }
    }
    if (r.code !== 0) { ui.fail(`${p.name}: ${r.err.split("\n").pop()}`); rc = 1; continue; }
    ui.step(`${p.name} → ${contract(root)}${p.layout === "worktrees" ? ui.dim(" (worktree layout)") : ""}${note}`);
    const ident = p.identity ? man.identities[p.identity] : undefined; const email = git.configGet(root, "user.email");
    if (ident && email !== ident.email) { ui.warn(`${p.name}: user.email resolved to '${email || "UNSET"}' — setting per-repo identity as fallback`); git.git(["config", "user.name", ident.name], root); git.git(["config", "user.email", ident.email], root); }
    if (p.postClone) spawnSync("bash", ["-lc", p.postClone], { cwd: cont, stdio: "inherit" });
    cloned.push(p.name);
  }
  if (cloned.length) { const wasQuiet = ui.isQuiet(); ui.setQuiet(true); try { runLink(repo, m, man, cloned); } finally { ui.setQuiet(wasQuiet); } ui.step(`Claude files linked into ${cloned.length} project(s)`); }
  return rc;
}
export async function create(repo: string, m: Machine, man: Manifest, name: string, ident: Identity, o: { profiles: string[]; description?: string; priv?: boolean; noGithub?: boolean; kind?: "git" | "synced" }): Promise<number> {
  if (!NAME_RE.test(name)) throw new Error(`cs: '${name}' is not a valid project name`);
  if (man.projects[name]) throw new Error(`cs: project '${name}' is already registered`);
  const ws = workspace(man, m), root = join(ws, name), branch = man.defaultBranch, owner = ident.owner, kind = o.kind ?? "git";
  if (kind === "git" && !owner && !o.noGithub) throw new Error(`cs: identity '${ident.id}' has no owner in projects.toml`);
  const url = owner ? `git@github.com:${owner}/${name}.git` : "";
  ui.intro(`new project ${ui.bold(name)}`);
  ui.kv("identity", `${ident.id}  ${ui.dim(`${ident.name} <${ident.email}>`)}`); ui.kv("path", contract(root));
  if (kind === "git") { ui.kv("remote", url || ui.dim("(none)")); ui.kv("branch", branch); } ui.kv("profiles", o.profiles.join(", "));
  mkdirSync(root, { recursive: true });
  if (!git.isRepo(root)) { git.git(["init", "-q", "-b", branch], root); ui.step(`git init -b ${branch}`); }
  if (kind === "git" && !o.noGithub && url) {
    try { const token = await github.ensureToken(owner);
      const created = await ui.spin(`creating ${owner}/${name} on GitHub…`, async () => github.ensureRepo(owner, name, token, o.priv !== false, o.description ?? ""));
      created ? ui.step(`github: created ${owner}/${name}  ${ui.dim(o.priv !== false ? "private" : "public")}`) : ui.skip(`github: ${owner}/${name} already exists`);
    } catch (e: any) { ui.fail(e.message); if (String(e.message).includes(" 403")) ui.info("fine-grained token needs: Repository access = All repositories, Administration = Read and write (edit the token on GitHub)"); return 1; }
  }
  if (kind === "git" && url) { const cur = git.remoteUrl(root); if (!cur) { git.git(["remote", "add", "origin", url], root); ui.step(`remote origin  ${ui.dim(url)}`); } else if (git.canonicalGithub(cur) !== git.canonicalGithub(url)) { ui.fail(`${root} already has origin ${cur}`); return 1; } }
  const email = git.configGet(root, "user.email");
  if (email !== ident.email) { if (url) ui.warn(`git identity resolved to '${email || "UNSET"}' (expected ${ident.email}); setting it per-repo. Run cs apply to fix globally.`); else ui.info(`no remote: git identity set per-repo (${ident.email})`);
    git.git(["config", "user.name", ident.name], root); git.git(["config", "user.email", ident.email], root); git.git(["config", "core.sshCommand", `ssh -i ${contract(expand(keyPath(ident)))} -o IdentitiesOnly=yes`], root); }
  if (!git.out(["rev-parse", "--verify", "-q", "HEAD"], root)) {
    if (!existsSync(join(root, "README.md"))) writeFileSync(join(root, "README.md"), `# ${name}\n\n${o.description ?? ""}`.trimEnd() + "\n");
    if (!existsSync(join(root, ".gitignore"))) writeFileSync(join(root, ".gitignore"), ".DS_Store\n*:Zone.Identifier\n.env\n");
    git.git(["add", "-A"], root); git.commit(root, "init", ident.name, ident.email); ui.step(`first commit on ${branch}  ${ui.dim(`${ident.name} <${ident.email}>`)}`);
  }
  if (kind === "git" && url && !o.noGithub && !git.aheadBehind(root)) {
    const r = await ui.spin("pushing…", async () => git.git(["push", "-q", "-u", "origin", branch], root, { check: false, timeout: 60 }));
    if (r.code !== 0) { ui.fail(r.err.split("\n").pop() ?? "push failed"); return 1; } ui.step(`pushed ${branch} to ${owner}/${name}`);
  }
  const p: Project = { name, kind: kind === "git" && !url ? "local" : kind, url: kind === "git" ? url : "", identity: kind === "git" ? ident.id : "", profiles: o.profiles, machines: [], branch: kind === "git" ? branch : "", layout: "plain", description: o.description, handoff: {}, sync: {} };
  appendProject(repo, p); if (git.isRepo(repo)) { git.git(["add", "projects.toml"], repo); git.commit(repo, `projects: add ${name}`, "cs", `cs@${m.name}`); }
  ui.step(`registered in projects.toml  ${ui.dim(`${p.kind}, profiles ${o.profiles.join(",")}`)}`);
  ui.setQuiet(true); runLink(repo, m, loadManifest(repo), [name]); ui.setQuiet(false);
  ui.step("Claude files linked (memory → config repo)");
  ui.outro(ui.bold(`cd ${contract(root)} && claude`));
  return 0;
}
