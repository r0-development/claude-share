/** Per-machine, untracked config: ~/.config/claude-share/machine.toml */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parse, stringify } from "smol-toml";
import { expand, machineFile, shareDirDefault } from "./paths.js";

export interface Machine {
  name: string;
  profiles: string[];
  exclude: string[];
  workspace?: string;
  repo?: string;
  secretsBackend: "sops" | "none";
}
export const shareDir = (m: Machine) => (m.repo ? expand(m.repo) : shareDirDefault());

export function machineExists() { return existsSync(machineFile()); }
export function loadMachine(): Machine {
  if (!machineExists()) throw new Error("cs: no machine config yet — run `cs init` first");
  const d = parse(readFileSync(machineFile(), "utf8")) as any;
  return { name: d.name, profiles: d.profiles ?? ["personal"], exclude: d.exclude ?? [], workspace: d.workspace, repo: d.repo,
    secretsBackend: d.secrets?.backend ?? "sops" };
}
export function saveMachine(m: Machine) {
  const obj: any = { name: m.name, profiles: m.profiles, exclude: m.exclude };
  if (m.workspace) obj.workspace = m.workspace;
  if (m.repo) obj.repo = m.repo;
  obj.secrets = { backend: m.secretsBackend };
  mkdirSync(dirname(machineFile()), { recursive: true });
  writeFileSync(machineFile(), "# claude-share machine config (not synced). Edit freely.\n" + stringify(obj) + "\n");
}
