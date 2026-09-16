/** On-disk names from before the glossary: the detection and the moves. Old names are spelled out here and, for the
 *  fallbacks that keep an unmigrated machine working, in src/paths.ts (share dir, share key), src/machine.ts (`repo` key)
 *  and src/manifest.ts (`github_owner`). cs doctor prints each move (docs/MIGRATION.md has the full list); cs doctor --fix
 *  performs the ones that are local and safe. Handoffs under the old ref namespace on a project remote are only
 *  reported: nothing touches a project remote unattended (ADR-0002). */
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "smol-toml";
import * as git from "./git.js";
import { contract, expand, legacyShareDir, legacyShareKey, machineFile, shareDirDefault, shareKeyDefault, stateDir } from "./paths.js";
import { saveMachine, shareDir, type Machine } from "./machine.js";
import { selectedProjects, workspace, type Manifest } from "./manifest.js";
import { configureRepo, keyPath, usesKey } from "./sharekey.js";
import { dirs, locate, present, REF_NS } from "./checkout.js";
import { applyLinks } from "./apply.js";
import { syncProject } from "./link.js";

const OLD_REF_NS = "wip";
/** `move`: the move as the person would read it, `apply` performs it (without `apply` the instruction is all cs can offer);
 *  `then`: what --fix does on top of the move so nothing depends on the old place. */
export interface OldName { what: string; move: string; then?: string; apply?: () => void }

/** Every old name still in use here or in the share, each with its move. */
export function findOldNames(repo: string, m: Machine, man: Manifest): OldName[] {
  const out: OldName[] = [];
  // the share key: ~/.ssh/cs/master → ~/.ssh/cs/share, and the share's core.sshCommand that names it
  if (existsSync(legacyShareKey()) && !existsSync(shareKeyDefault()))
    out.push({ what: `share key ${contract(legacyShareKey())}`, move: `mv ${contract(legacyShareKey())} ${contract(shareKeyDefault())} (and .pub)`,
      apply: () => { for (const s of ["", ".pub"]) if (existsSync(legacyShareKey() + s)) renameSync(legacyShareKey() + s, shareKeyDefault() + s); if (git.isRepo(repo) && git.remoteUrl(repo)) configureRepo(repo); } });
  else if (existsSync(legacyShareKey()) && existsSync(shareKeyDefault()))
    out.push({ what: `two share keys: ${contract(legacyShareKey())} and ${contract(shareKeyDefault())}`, move: `remove the one that is not registered as the share's deploy key (cs ssh share-key checks ${contract(shareKeyDefault())})` });
  // the key was renamed by hand: the share's checkout still names the old file (with two keys around, the item above decides first)
  else if (git.isRepo(repo) && git.remoteUrl(repo) && !usesKey(repo) && git.configGet(repo, "core.sshCommand").includes(contract(legacyShareKey())))
    out.push({ what: `the share's core.sshCommand names ${contract(legacyShareKey())}`, move: `git -C ${contract(repo)} config core.sshCommand "ssh -i ${contract(keyPath())} -o IdentitiesOnly=yes"`, apply: () => configureRepo(repo) });
  // the manifest: keys from before the glossary (rewritten in place, before the checkout itself may move)
  const mf = join(repo, "projects.toml"); const text = existsSync(mf) ? readFileSync(mf, "utf8") : "";
  if (/^\s*(kind|github_owner)\s*=/m.test(text))
    out.push({ what: "projects.toml keys `kind` / `github_owner`", move: "drop `kind = …` lines, rename `github_owner` to `owner` (the next cs sync carries it)", apply: () => writeFileSync(mf, text.split("\n").filter((l) => !/^\s*kind\s*=/.test(l)).map((l) => l.replace(/^(\s*)github_owner(\s*=)/, "$1owner$2")).join("\n")) });
  // the share's checkout: ~/.config/claude-share/repo → ~/.config/claude-share/share; machine.toml `repo =` → `share =`
  const oldKeyInToml = machineTomlHas("repo");
  if (repo === legacyShareDir() || oldKeyInToml)
    out.push({ what: repo === legacyShareDir() ? `share checkout ${contract(legacyShareDir())}` : "machine.toml key `repo`", move: repo === legacyShareDir() ? `mv ${contract(legacyShareDir())} ${contract(shareDirDefault())}` : "rename the key to `share` in machine.toml",
      then: repo === legacyShareDir() ? "the ~/.claude links and every checkout's memory path are re-rendered (cs apply, cs link)" : undefined,
      apply: () => {
        let target = repo;
        if (repo === legacyShareDir() && !existsSync(shareDirDefault())) { mkdirSync(join(shareDirDefault(), ".."), { recursive: true }); renameSync(legacyShareDir(), shareDirDefault()); target = shareDirDefault(); }
        if (oldKeyInToml || m.share) { m.share = m.share && expand(m.share) !== legacyShareDir() && expand(m.share) !== shareDirDefault() ? m.share : undefined; saveMachine(m); }
        if (target !== repo) { const changes: string[] = []; applyLinks(target, false, changes); const ws = workspace(man, m); for (const p of selectedProjects(man, m)) if (dirs(p, ws).length) syncProject(target, p, ws); }
      } });
  // state files: last-config → last-sync, link/ → project-state/; sync-config.lock, blocked-config, handoff/pending are gone
  const st = stateDir(), inState = `(in ${contract(st)})`;
  if (existsSync(join(st, "last-config"))) out.push({ what: "state file last-config", move: `mv last-config last-sync ${inState}`, apply: () => { if (existsSync(join(st, "last-sync"))) rmSync(join(st, "last-config")); else renameSync(join(st, "last-config"), join(st, "last-sync")); } });
  if (existsSync(join(st, "link"))) out.push({ what: "state directory link/", move: `mv link project-state ${inState}`, apply: () => mergeDir(join(st, "link"), join(st, "project-state")) });
  for (const f of ["sync-config.lock", "blocked-config", "handoff/pending"]) if (existsSync(join(st, f))) out.push({ what: `state file ${f}`, move: `rm ${f} ${inState} — no longer read`, apply: () => rmSync(join(st, f), { force: true }) });
  // handoffs under the old ref namespace: on the project remote (asked with a short cap, offline tolerated; what the last
  // fetch brought counts too) or a local leftover — reported with the exact command, never moved by cs
  const ws = workspace(man, m);
  for (const p of selectedProjects(man, m)) {
    const c = locate(p, ws); if (!present(c)) continue; const root = c.root;
    const at = (cmd: string) => `git -C ${contract(root)} ${cmd}`;
    const fetched = git.out(["for-each-ref", "--format=%(refname:short)", `refs/remotes/origin/${OLD_REF_NS}/`], root).split("\n").filter(Boolean).map((r) => r.replace(/^origin\//, ""));
    const remote = git.git(["ls-remote", "--heads", "origin", `refs/heads/${OLD_REF_NS}/*`], root, { check: false, timeout: 5 }).out.split("\n").filter(Boolean).map((l) => l.split(/\s+/)[1].replace(/^refs\/heads\//, ""));
    for (const short of [...new Set([...fetched, ...remote])]) {
      const renamed = short.replace(new RegExp(`^${OLD_REF_NS}/`), `${REF_NS}/`); const track = `refs/remotes/origin/${short}`;
      out.push({ what: `${p.name}: handoff ${short} on the remote`, move: `apply it with the cs that sent it, or rename it there: ${fetched.includes(short) ? "" : `${at(`fetch origin +refs/heads/${short}:${track}`)} && `}${at(`push origin ${track}:refs/heads/${renamed} :refs/heads/${short}`)} && ${at(`update-ref -d ${track}`)}` });
    }
    for (const short of git.out(["for-each-ref", "--format=%(refname:short)", `refs/heads/${OLD_REF_NS}/`], root).split("\n").filter(Boolean))
      out.push({ what: `${p.name}: handoff ${short} here`, move: `a handoff that never reached the remote (the changes are still in the tree): ${at(`branch -D ${short}`)}` });
  }
  return out;
}

/** Perform every move that has one. Returns the share's path afterwards (it may have moved) and one line per move for the report. */
export function migrate(repo: string, m: Machine, man: Manifest): { repo: string; done: string[] } {
  const done: string[] = [];
  for (const o of findOldNames(repo, m, man)) if (o.apply) { o.apply(); done.push(`${o.what}: ${o.move}${o.then ? ` — ${o.then}` : ""}`); }
  return { repo: shareDir(m), done };
}

function machineTomlHas(key: string): boolean { try { return key in (parse(readFileSync(machineFile(), "utf8")) as object); } catch { return false; } }
/** Move `from` into `to`, keeping whatever `to` already has. */
function mergeDir(from: string, to: string) {
  if (!existsSync(to)) { renameSync(from, to); return; }
  for (const f of readdirSync(from)) if (!existsSync(join(to, f))) renameSync(join(from, f), join(to, f));
  rmSync(from, { recursive: true, force: true });
}
