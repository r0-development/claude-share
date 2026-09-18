/** cs ignore <dirs...>: mark directories directly under the workspace as ignored here (CONTEXT.md: ignored directory) — bare cs
 *  and cs doctor stop mentioning them on this machine. Written to machine.toml, never to the share; undo by editing the file. */
import { basename, dirname, resolve } from "node:path";
import { contract } from "./paths.js";
import { ignoreDirs } from "./machine.js";
import { workspace, type Share } from "./share.js";
import { sniff } from "./checkout.js";
import * as ui from "./ui.js";

/** A name, or a path that must be a direct child of the workspace — reduced to its name; inside a worktrees layout
 *  (`<name>/repo`, the rule cs add applies) the directory above is the one. */
function nameOf(arg: string, ws: string): string {
  let path = resolve(arg);
  if (basename(path) === "repo" && dirname(dirname(path)) === ws && sniff(dirname(path)).layout === "worktrees") path = dirname(path);
  if (dirname(path) === ws) return basename(path);
  if (arg.includes("/") || arg === ".") throw new Error(`cs: ${contract(path)} is not directly under the workspace ${contract(ws)}`);
  return arg;
}

/** cs ignore: names or paths; a registered project is refused (exclude / cs remove are its verbs); one line per name. */
export function ignore(share: Share, args: string[]): void {
  const ws = resolve(workspace(share)); const man = share.manifest;
  const names = [...new Set(args.map((a) => nameOf(a, ws)))];
  for (const n of names) {
    const p = Object.values(man.projects).find((p) => (p.path || p.name) === n);
    if (p) throw new Error(`cs: ${n} is the registered project ${p.name} — to skip it here add it to exclude in machine.toml, to take it out of the share run cs remove ${p.name}`);
  }
  const { added, already } = ignoreDirs(share.machine, names);
  for (const n of added) ui.ok(`${n}: ignored here  ${ui.dim("(machine.toml ignore — delete the name to undo)")}`);
  for (const n of already) ui.info(`${n}: already ignored here`);
}
