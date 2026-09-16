/** Per-machine, untracked config: ~/.config/claude-share/machine.toml */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parse, stringify } from "smol-toml";
import { expand, legacyShareDir, machineFile, shareDirDefault } from "./paths.js";

export interface Machine {
  name: string;
  profiles: string[];
  exclude: string[];
  workspace?: string;
  /** Where the share is checked out when not the default (`share = "…"` in machine.toml). */
  share?: string;
  secretsBackend: "sops" | "none";
}
/** The share's checkout: `share` from machine.toml, else the default — or the old-named directory until cs doctor --fix moves it. */
export const shareDir = (m: Machine) => (m.share ? expand(m.share) : !existsSync(shareDirDefault()) && existsSync(legacyShareDir()) ? legacyShareDir() : shareDirDefault());

export function machineExists() { return existsSync(machineFile()); }
export function loadMachine(): Machine {
  if (!machineExists()) throw new Error("cs: no machine config yet — run `cs init` first");
  const d = parse(readFileSync(machineFile(), "utf8")) as any;
  return { name: d.name, profiles: d.profiles ?? ["personal"], exclude: d.exclude ?? [], workspace: d.workspace, share: d.share ?? d.repo,   // `repo`: the key's old name, rewritten by cs doctor --fix
    secretsBackend: d.secrets?.backend ?? "sops" };
}
export function saveMachine(m: Machine) {
  const obj: any = { name: m.name, profiles: m.profiles, exclude: m.exclude };
  if (m.workspace) obj.workspace = m.workspace;
  if (m.share) obj.share = m.share;
  obj.secrets = { backend: m.secretsBackend };
  mkdirSync(dirname(machineFile()), { recursive: true });
  writeFileSync(machineFile(), "# claude-share machine config (not synced). Edit freely.\n" + stringify(obj) + "\n");
}
