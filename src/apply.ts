/** cs apply: render ~/.claude from <repo>/claude, git identity includes, shell rc block. */
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, realpathSync, renameSync, rmdirSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync, copyFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { claudeDir, contract, expand, home, stateDir, toolRoot } from "./paths.js";
import { shellRc } from "./platform.js";
import { globs, keyPath, type Manifest } from "./manifest.js";
import type { Share } from "./share.js";
import { diffKeys, dumps, loads, mergeLayers } from "./jsonmerge.js";

const LINK_ITEMS = ["CLAUDE.md", "rules", "agents", "themes", "keybindings.json", "statusline.sh"];
const GIT_MARK = "# >>> claude-share >>>", GIT_END = "# <<< claude-share <<<";
const stamp = () => new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);

function backup(target: string) {
  const d = join(stateDir(), "backups", stamp()); mkdirSync(d, { recursive: true });
  const dest = join(d, basename(target));
  if (statSync(target).isDirectory()) renameSync(target, dest); else { copyFileSync(target, dest); unlinkSync(target); }
}
function mergeDirInto(src: string, dst: string) {
  const walk = (dir: string) => { for (const e of readdirSync(dir, { withFileTypes: true })) { const f = join(dir, e.name); if (e.isDirectory()) walk(f); else {
    const rel = f.slice(dst.length + 1); const t = join(src, rel);
    if (!existsSync(t)) { mkdirSync(dirname(t), { recursive: true }); renameSync(f, t); } } } };
  walk(dst); rmSync(dst, { recursive: true, force: true });
}
const isLink = (p: string) => { try { return lstatSync(p).isSymbolicLink(); } catch { return false; } };
const real = (p: string) => { try { return realpathSync(p); } catch { return resolve(p); } };

function link(src: string, dst: string, check: boolean, changes: string[]) {
  if (isLink(dst)) {
    // a link that resolves to src through another link (e.g. ~/.claude/skills/x → ../../.agents/skills/x → repo) is fine as is
    if (resolve(dirname(dst), readlinkSync(dst)) === resolve(src) || real(dst) === real(src)) return;
    changes.push(`relink ${contract(dst)}`); if (!check) { unlinkSync(dst); symlinkSync(src, dst); } return;
  }
  if (existsSync(dst)) {
    if (statSync(dst).isDirectory()) { changes.push(`import ${contract(dst)} → ${contract(src)} (merge)`); if (!check) { mkdirSync(src, { recursive: true }); mergeDirInto(src, dst); symlinkSync(src, dst); } }
    else if (!existsSync(src)) { changes.push(`import ${contract(dst)} → ${contract(src)}`); if (!check) { mkdirSync(dirname(src), { recursive: true }); renameSync(dst, src); symlinkSync(src, dst); } }
    else { changes.push(`replace ${contract(dst)} (backup kept)`); if (!check) { backup(dst); symlinkSync(src, dst); } }
    return;
  }
  if (!existsSync(src)) return;
  changes.push(`link ${contract(dst)}`); if (!check) { mkdirSync(dirname(dst), { recursive: true }); symlinkSync(src, dst); }
}

export function settingsLayers(share: Share): [string, Record<string, unknown>][] {
  const m = share.machine; const names = ["settings.base.json", ...m.profiles.map((p) => `settings.${p}.json`), `settings.${m.name}.json`];
  return names.filter((n) => existsSync(join(share.path, "claude", n))).map((n) => [n, loads(readFileSync(join(share.path, "claude", n), "utf8"))]);
}
export const renderSettings = (share: Share) => mergeLayers(...settingsLayers(share).map(([, d]) => d));

export function applySettings(share: Share, check: boolean, changes: string[]) {
  if (!settingsLayers(share).length) return;
  const target = join(claudeDir(), "settings.json");
  const desired = renderSettings(share);
  const current = existsSync(target) ? loads(readFileSync(target, "utf8")) : {};
  if (JSON.stringify(current) === JSON.stringify(desired)) return;
  const keys = diffKeys(current, desired);
  changes.push(`settings.json: ${keys.slice(0, 8).join(", ")}${keys.length > 8 ? " …" : ""}`);
  if (!check) { mkdirSync(claudeDir(), { recursive: true }); if (existsSync(target)) { const d = join(stateDir(), "backups", stamp()); mkdirSync(d, { recursive: true }); copyFileSync(target, join(d, "settings.json")); } writeFileSync(target, dumps(desired)); }
}
export function applyLinks(repo: string, check: boolean, changes: string[]) {
  const cdir = claudeDir(); mkdirSync(cdir, { recursive: true });
  for (const item of LINK_ITEMS) link(join(repo, "claude", item), join(cdir, item), check, changes);
  // skills.sh (`npx skills add … -g`) installs into ~/.agents/skills and symlinks ~/.claude/skills/<name> there;
  // make that directory (and its lock file) the repo's claude/skills so installs land in the share directly.
  const skills = join(repo, "claude", "skills"), agents = join(home(), ".agents");
  link(skills, join(agents, "skills"), check, changes);
  link(join(repo, "claude", "skill-lock.json"), join(agents, ".skill-lock.json"), check, changes);
  if (existsSync(skills)) { mkdirSync(join(cdir, "skills"), { recursive: true }); for (const e of readdirSync(skills, { withFileTypes: true })) if (e.isDirectory()) link(join(skills, e.name), join(cdir, "skills", e.name), check, changes); }
  link(join(repo, "plans"), join(cdir, "plans"), check, changes);
}
export function renderGitIncludes(man: Manifest): Record<string, string> {
  const gdir = join(home(), ".config", "git"); const files: Record<string, string> = {};
  const inc = ["# generated by `cs apply` — do not edit; edit projects.toml [identities] instead"];
  for (const i of Object.values(man.identities)) {
    files[join(gdir, `identity-${i.id}.inc`)] = [`# identity '${i.id}' (generated by cs apply)`, "[user]", `\tname = ${i.name}`, `\temail = ${i.email}`, "[core]",
      `\tsshCommand = ssh -i ${contract(expand(keyPath(i)))} -o IdentitiesOnly=yes`].join("\n") + "\n";
    for (const g of globs(i)) inc.push(`[includeIf "hasconfig:remote.*.url:${g}"]`, `\tpath = identity-${i.id}.inc`);
  }
  files[join(gdir, "claude-share.inc")] = inc.join("\n") + "\n";
  return files;
}
export function applyGit(man: Manifest, check: boolean, changes: string[]) {
  const gdir = join(home(), ".config", "git"); const wanted = renderGitIncludes(man);
  if (existsSync(gdir)) for (const f of readdirSync(gdir)) if (/^identity-.*\.inc$/.test(f) && !(join(gdir, f) in wanted)) { changes.push(`remove stale ${contract(join(gdir, f))}`); if (!check) unlinkSync(join(gdir, f)); }
  for (const [f, content] of Object.entries(wanted)) { if (existsSync(f) && readFileSync(f, "utf8") === content) continue; changes.push(`write ${contract(f)}`); if (!check) { mkdirSync(gdir, { recursive: true }); writeFileSync(f, content); } }
  const gc = join(home(), ".gitconfig"); const text = existsSync(gc) ? readFileSync(gc, "utf8") : "";
  const block = `${GIT_MARK}\n[include]\n\tpath = ~/.config/git/claude-share.inc\n${GIT_END}\n`;
  const next = text.includes(GIT_MARK) ? text.slice(0, text.indexOf(GIT_MARK)) + block + text.slice(text.indexOf(GIT_END) + GIT_END.length + 1) : text + (text && !text.endsWith("\n") ? "\n" : "") + block;
  if (next !== text) { changes.push("~/.gitconfig: include claude-share.inc"); if (!check) writeFileSync(gc, next); }
}
export function applyShellRc(check: boolean, changes: string[]) {
  const rc = shellRc(); const sh = contract(join(toolRoot(), "shell", "cs.sh"));
  const block = `${GIT_MARK}\n[ -f "${sh}" ] && . "${sh}"\n${GIT_END}\n`;
  const text = existsSync(rc) ? readFileSync(rc, "utf8") : "";
  const next = text.includes(GIT_MARK) ? text.slice(0, text.indexOf(GIT_MARK)) + block + text.slice(text.indexOf(GIT_END) + GIT_END.length + 1) : text + (text && !text.endsWith("\n") ? "\n" : "") + block;
  if (next !== text) { changes.push(`${contract(rc)}: source shell/cs.sh (claude() wrapper, PATH)`); if (!check) writeFileSync(rc, next); }
}
/** Everything ~/.claude, the git includes and the shell rc need to match the share (silent: the change lines come back,
 *  the caller prints them); with `check` nothing is written. */
export function runApply(share: Share, check = false): string[] {
  const changes: string[] = [];
  applySettings(share, check, changes); applyLinks(share.path, check, changes); applyGit(share.manifest, check, changes); applyShellRc(check, changes);
  return changes;
}
