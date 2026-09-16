/** cs identity add|rename|ls */
import { existsSync, renameSync } from "node:fs";
import * as git from "./git.js";
import * as github from "./github.js";
import { expand } from "./paths.js";
import { keyPath, NAME_RE, type Identity, type Manifest } from "./manifest.js";
import { addIdentity, commit, renameIdentity, type Share } from "./share.js";
import { applyGit } from "./apply.js";
import * as ui from "./ui.js";

export async function add(share: Share, id: string, o: { owner: string; name: string; email: string; key?: string; noToken?: boolean }): Promise<number> {
  if (!NAME_RE.test(id)) throw new Error(`cs: '${id}' is not a valid identity id`);
  const ident: Identity = { id, name: o.name, email: o.email, owner: o.owner, sshKey: o.key };
  addIdentity(share, ident); commit(share, `identities: add ${id}`, ["projects.toml"]);
  ui.step(`identity ${ui.bold(id)}  ${ui.dim(`${o.name} <${o.email}> · github.com/${o.owner} · key ${keyPath(ident)}`)}`);
  const ch: string[] = []; applyGit(share.manifest, false, ch); if (ch.length) ui.step("git identity includes updated");
  if (!existsSync(expand(keyPath(ident)))) ui.info(`no key at ${keyPath(ident)} yet — cs ssh setup generates and registers it`);
  if (!o.noToken && !github.getToken(o.owner)) { ui.info(`a GitHub token for ${o.owner} lets cs new --${id} create repos:`);
    try { await github.ensureToken(o.owner); ui.ok(`token for ${o.owner} stored`); } catch (e: any) { ui.warn(`no token stored (${e.message}); run cs token set ${o.owner} later`); } }
  return 0;
}
export function rename(share: Share, oldId: string, newId: string): number {
  const man = share.manifest, repo = share.path;
  if (!man.identities[oldId]) throw new Error(`cs: unknown identity '${oldId}'`);
  if (man.identities[newId] || !NAME_RE.test(newId)) throw new Error(`cs: '${newId}' is taken or invalid`);
  const ident = man.identities[oldId]; const n = Object.values(man.projects).filter((p) => p.identity === oldId).length;
  renameIdentity(share, oldId, newId);
  if (!ident.sshKey) { for (const s of ["", ".pub"]) { const a = expand(`~/.ssh/cs/${oldId}${s}`), b = expand(`~/.ssh/cs/${newId}${s}`); if (existsSync(a)) renameSync(a, b); } ui.step(`~/.ssh/cs/${oldId} → ~/.ssh/cs/${newId}`); }
  for (const d of git.out(["ls-files", `machines/*/ssh/${oldId}.pub`], repo).split("\n").filter(Boolean)) git.git(["mv", d, d.replace(`${oldId}.pub`, `${newId}.pub`)], repo);
  commit(share, `identities: rename ${oldId} → ${newId}`, ["projects.toml"]);
  ui.ok(`identity ${oldId} → ${newId} (${n} projects updated)`);
  const ch: string[] = []; applyGit(share.manifest, false, ch); for (const c of ch) ui.step(c);
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
