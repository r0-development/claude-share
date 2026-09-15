/** cs identity add|rename|ls */
import { existsSync, renameSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as git from "./git.js";
import * as github from "./github.js";
import { expand } from "./paths.js";
import type { Machine } from "./config.js";
import { appendIdentity, keyPath, loadManifest, NAME_RE, type Identity, type Manifest } from "./manifest.js";
import { applyGit } from "./apply.js";
import * as ui from "./ui.js";

export async function add(repo: string, m: Machine, man: Manifest, id: string, o: { owner: string; name: string; email: string; key?: string; noToken?: boolean }): Promise<number> {
  if (!NAME_RE.test(id)) throw new Error(`cs: '${id}' is not a valid identity id`);
  const ident: Identity = { id, name: o.name, email: o.email, owner: o.owner, sshKey: o.key };
  appendIdentity(repo, ident); git.git(["add", "projects.toml"], repo); git.commit(repo, `identities: add ${id}`, "cs", `cs@${m.name}`);
  ui.step(`identity ${ui.bold(id)}  ${ui.dim(`${o.name} <${o.email}> · github.com/${o.owner} · key ${keyPath(ident)}`)}`);
  const ch: string[] = []; applyGit(loadManifest(repo), false, ch); if (ch.length) ui.step("git identity includes updated");
  if (!existsSync(expand(keyPath(ident)))) ui.info(`no key at ${keyPath(ident)} yet — cs ssh setup generates and registers it`);
  if (!o.noToken && !github.getToken(o.owner)) { ui.info(`a GitHub token for ${o.owner} lets cs new --${id} create repos:`);
    try { await github.ensureToken(o.owner); ui.ok(`token for ${o.owner} stored`); } catch (e: any) { ui.warn(`no token stored (${e.message}); run cs token set ${o.owner} later`); } }
  return 0;
}
export function rename(repo: string, m: Machine, man: Manifest, oldId: string, newId: string): number {
  if (!man.identities[oldId]) throw new Error(`cs: unknown identity '${oldId}'`);
  if (man.identities[newId] || !NAME_RE.test(newId)) throw new Error(`cs: '${newId}' is taken or invalid`);
  const ident = man.identities[oldId]; const f = join(repo, "projects.toml"); let t = readFileSync(f, "utf8");
  t = t.replace(new RegExp(`^\\[identities\\.${oldId}\\]`, "m"), `[identities.${newId}]`).replace(new RegExp(`^(identity\\s*=\\s*)"${oldId}"`, "mg"), `$1"${newId}"`);
  writeFileSync(f, t);
  if (!ident.sshKey) { for (const s of ["", ".pub"]) { const a = expand(`~/.ssh/cs/${oldId}${s}`), b = expand(`~/.ssh/cs/${newId}${s}`); if (existsSync(a)) renameSync(a, b); } ui.step(`~/.ssh/cs/${oldId} → ~/.ssh/cs/${newId}`); }
  for (const d of git.out(["ls-files", `machines/*/ssh/${oldId}.pub`], repo).split("\n").filter(Boolean)) git.git(["mv", d, d.replace(`${oldId}.pub`, `${newId}.pub`)], repo);
  git.git(["add", "projects.toml"], repo); git.commit(repo, `identities: rename ${oldId} → ${newId}`, "cs", `cs@${m.name}`);
  const n = Object.values(man.projects).filter((p) => p.identity === oldId).length; ui.ok(`identity ${oldId} → ${newId} (${n} projects updated)`);
  const ch: string[] = []; applyGit(loadManifest(repo), false, ch); for (const c of ch) ui.step(c);
  return 0;
}
export function ls(man: Manifest) {
  const ids = Object.values(man.identities);
  if (!ids.length) { ui.info('no identities — add one: cs identity add personal --owner <github-user> --name ".." --email ..'); return; }
  ui.table(ids.map((i) => { const n = Object.values(man.projects).filter((p) => p.identity === i.id).length; const key = expand(keyPath(i));
    return [ui.bold(i.id), `${i.name} <${i.email}>`, i.owner || ui.dim("-"), existsSync(key) ? keyPath(i) : ui.red(keyPath(i) + " (missing)"), github.getToken(i.owner) ? ui.green("token ✓") : ui.dim("no token"), ui.dim(`${n} project${n === 1 ? "" : "s"}`)]; }),
    ["id", "commits as", "github owner", "ssh key", "", ""]);
  ui.info(ui.dim("use as: cs new <name> --<id>   (or --<github owner>)"));
}
