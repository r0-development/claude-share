/** Secrets backends: sops (default) | none. */
import { join } from "node:path";
import type { Machine } from "../machine.js";

export interface Backend {
  name: string;
  init(repo: string, m: Machine, interactive: boolean): Promise<void>;
  ready(repo: string): boolean;
  loadEnv(repo: string, name: string): Record<string, string>;
  writeEnv(repo: string, name: string, values: Record<string, string>): string;
  edit(repo: string, name: string): void;
  status(repo: string, m: Machine): void;
}
export async function getBackend(m: Machine): Promise<Backend> {
  if (m.secretsBackend === "sops") return (await import("./sops.js")).SopsBackend;
  if (m.secretsBackend === "none") return (await import("./none.js")).NoneBackend;
  throw new Error(`cs: unknown secrets backend '${m.secretsBackend}' (sops | none)`);
}
export const envFile = (repo: string, name: string) => (name === "global" ? join(repo, "secrets", "global.env") : join(repo, "secrets", "projects", `${name}.env`));
export function parseDotenv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (let line of text.split("\n")) { line = line.trim(); if (!line || line.startsWith("#") || !line.includes("=")) continue;
    let [k, ...rest] = line.split("="); let v = rest.join("=").trim(); k = k.trim().replace(/^export\s+/, "");
    if (v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"') { try { v = JSON.parse(v); } catch { v = v.slice(1, -1); } }
    else if (v.length >= 2 && v[0] === "'" && v[v.length - 1] === "'") v = v.slice(1, -1);
    out[k] = v; }
  return out;
}
export const dumpDotenv = (v: Record<string, string>) => Object.entries(v).map(([k, val]) => `${k}=${/[ #"'\\$`]/.test(val) || val === "" ? JSON.stringify(val) : val}`).join("\n") + (Object.keys(v).length ? "\n" : "");
