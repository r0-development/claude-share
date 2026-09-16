/** The Share (see CONTEXT.md): its checkout on this machine, this machine, and the manifest — one object in place of the
 *  (repo, machine, manifest) triple every command used to take. A manifest write goes through here and reloads `manifest`
 *  on the same object, so every holder sees the change; a plain mutable record, not a class (ADR-0004's reasoning). */
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import * as git from "./git.js";
import { loadMachine, shareDir, type Machine } from "./machine.js";
import * as manifest from "./manifest.js";
import { addIdentityText, addProjectText, loadManifest, removeProjectText, renameIdentityText, updateProjectText, type Identity, type Manifest, type Project } from "./manifest.js";

export interface Share { path: string; machine: Machine; manifest: Manifest }

/** Production wiring by default (machine.toml, the share dir it names); tests pass both. */
export function open(machine: Machine = loadMachine(), path: string = shareDir(machine)): Share {
  return { path, machine, manifest: loadManifest(path) };
}
/** Re-read the manifest after something else changed the file (a pull, a migration). */
export function reload(share: Share): Share { share.manifest = loadManifest(share.path); return share; }

/** The workspace on this machine (machine.toml's override, else the manifest's root), expanded. */
export const workspace = (share: Share) => manifest.workspace(share.manifest, share.machine);
/** The projects this machine gets: profiles intersect, not excluded, not pinned to other machines. */
export const selectedProjects = (share: Share) => manifest.selectedProjects(share.manifest, share.machine);
/** The registered project a path inside the workspace belongs to. */
export const projectForPath = (share: Share, path: string) => manifest.projectForPath(share.manifest, share.machine, path);

// ---------------------------------------------------------------- manifest writes: read → pure transform → write → reload
const manifestFile = (share: Share) => join(share.path, "projects.toml");
function edit(share: Share, transform: (text: string) => string) {
  const f = manifestFile(share); writeFileSync(f, transform(readFileSync(f, "utf8"))); reload(share);
}
export const addProject = (share: Share, p: Project) => edit(share, (t) => addProjectText(t, p));
export const updateProject = (share: Share, p: Project) => edit(share, (t) => updateProjectText(t, p));
/** False when the manifest had no such project (nothing written). */
export function removeProject(share: Share, name: string): boolean {
  let found = false; edit(share, (t) => { const r = removeProjectText(t, name); found = r.found; return r.text; }); return found;
}
export const addIdentity = (share: Share, i: Identity) => edit(share, (t) => addIdentityText(t, i));
export const renameIdentity = (share: Share, oldId: string, newId: string) => edit(share, (t) => renameIdentityText(t, oldId, newId));

// ---------------------------------------------------------------- commit as this machine
/** Stage `paths` (share-relative or absolute; everything when omitted) and commit them as this machine: the subject is
 *  `message`, a `Cs-Machine: <name>` trailer names the machine (what `stampOf` reads back). Returns the short sha, or
 *  undefined when nothing was staged or the share is not a git repo yet (a skeleton before cs init). */
export function commit(share: Share, message: string, paths?: string[]): string | undefined {
  if (!git.isRepo(share.path)) return undefined;
  if (paths) for (const p of paths) git.git(["add", "-A", "--", p], share.path, { check: false });   // a path that matches nothing (never committed, now gone) is fine
  else git.git(["add", "-A"], share.path);
  if (git.git(["diff", "--cached", "--quiet"], share.path, { check: false }).code === 0) return undefined;
  git.commit(share.path, `${message}\n\nCs-Machine: ${share.machine.name}`, "cs", `cs@${share.machine.name}`);
  return git.out(["rev-parse", "--short", "HEAD"], share.path);
}

/** When a file in the share last changed and from which machine: for a committed, unmodified file the commit's time and
 *  the machine `commit` stamped — read from the `Cs-Machine` trailer, or for history from before it, the `sync(<machine>):`
 *  subject cs sync used, then the `cs@<machine>` fallback author; a file modified since (or never committed) → its mtime,
 *  no machine. The stored `.env` merge uses this to say whose value is newest. */
export function stampOf(share: Share, file: string): { when: string; from?: string } {
  const rel = isAbsolute(file) ? relative(share.path, file) : file;
  const [when, subject, email, sha] = git.out(["log", "-1", "--format=%cI%n%s%n%ae%n%H", "--", rel], share.path).split("\n");
  if (when && git.git(["diff", "--quiet", "--", rel], share.path, { check: false }).code === 0) {
    const from = git.trailers(share.path, sha)["Cs-Machine"] || subject?.match(/^sync\(([^)]+)\):/)?.[1] || (email?.startsWith("cs@") ? email.slice(3) : undefined);
    return from ? { when, from } : { when };
  }
  return { when: new Date(statSync(join(share.path, rel)).mtimeMs).toISOString() };
}
