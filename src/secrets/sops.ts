/** The sops + age secrets store: entries are `secrets/global.env` and `secrets/projects/<name>.env` in the share, encrypted
 *  per value; the per-machine key is ~/.config/sops/age/keys.txt, public keys live in machines/<m>/age.pub, recipients in
 *  .sops.yaml. `init` / `edit` / `status` are what the cs secrets commands do with this backend. */
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { contract, home, toolRoot } from "../paths.js";
import { which } from "../deps.js";
import { commit, stampOf, type Share } from "../share.js";
import type { SecretsStore } from "./index.js";
import { dumpDotenv, parseDotenv, type Values } from "../env.js";
import * as ui from "../ui.js";

const RULE = "^secrets/.*\\.env$";
export const keyFile = () => process.env.SOPS_AGE_KEY_FILE || join(home(), ".config", "sops", "age", "keys.txt");
const env = () => { const e: NodeJS.ProcessEnv = { ...process.env, SOPS_AGE_KEY_FILE: keyFile() }; delete e.SOPS_AGE_RECIPIENTS; return e; };
const exe = (n: string) => which(n) || join(home(), ".local", "bin", n);
/** sops as a subprocess — async, since every caller may be under a spinner. */
async function sops(args: string[], repo: string) {
  const { exec } = await import("../proc.js");
  const p = await exec(exe("sops"), args, { cwd: repo, env: env() });
  if (p.code !== 0) throw new Error(`cs: sops ${args.join(" ")} failed: ${p.err}`);
  return p;
}
const DOTENV = ["--input-type", "dotenv", "--output-type", "dotenv"];
/** The entry's file in the share. */
export const envFile = (repo: string, name: string) => (name === "global" ? join(repo, "secrets", "global.env") : join(repo, "secrets", "projects", `${name}.env`));
export function publicKey(): string {
  if (!existsSync(keyFile())) return "";
  const line = readFileSync(keyFile(), "utf8").split("\n").find((l) => l.startsWith("# public key:")); if (line) return line.split(":")[1].trim();
  return (spawnSync(exe("age-keygen"), ["-y", keyFile()], { encoding: "utf8" }).stdout ?? "").trim();
}
function keygen() { mkdirSync(dirname(keyFile()), { recursive: true, mode: 0o700 }); const p = spawnSync(exe("age-keygen"), ["-o", keyFile()], { encoding: "utf8" }); if (p.status !== 0) throw new Error(`cs: age-keygen failed: ${p.stderr}`); chmodSync(keyFile(), 0o600); }
export function recipients(repo: string): string[] {
  const f = join(repo, ".sops.yaml"); if (!existsSync(f)) return []; const t = readFileSync(f, "utf8");
  const m = t.match(/age:\s*>-?\s*\n((?:\s+.+\n?)+)/); if (m) return m[1].replace(/\n/g, " ").split(",").map((x) => x.trim()).filter(Boolean);
  const m2 = t.match(/age:\s*(\S.*)/); return m2 ? m2[1].split(",").map((x) => x.trim()).filter(Boolean) : [];
}
export function writeRecipients(repo: string, recs: string[]) {
  writeFileSync(join(repo, ".sops.yaml"), `# sops recipients — managed by cs secrets init / cs trust / cs untrust\ncreation_rules:\n  - path_regex: ${RULE}\n    age: >-\n` + recs.map((r) => `      ${r}`).join(",\n") + "\n");
}
export const machinePubFile = (repo: string, machine: string) => join(repo, "machines", machine, "age.pub");
const isEncrypted = (f: string) => { try { return readFileSync(f, "utf8").includes("sops_version="); } catch { return false; } };
/** Every `*.env` under `dir`, sorted. */
function envFiles(dir: string): string[] { const out: string[] = []; const rec = (d: string) => { if (!existsSync(d)) return; for (const e of readdirSync(d, { withFileTypes: true })) { const f = join(d, e.name); e.isDirectory() ? rec(f) : f.endsWith(".env") && out.push(f); } }; rec(dir); return out.sort(); }
export async function updatekeys(repo: string): Promise<number> {
  const { exec } = await import("../proc.js"); let n = 0;
  for (const f of envFiles(join(repo, "secrets"))) if (isEncrypted(f)) { const p = await exec(exe("sops"), ["updatekeys", "-y", relative(repo, f)], { cwd: repo, env: env() }); if (p.code !== 0) throw new Error(`cs: sops updatekeys failed: ${p.err}`); n++; }
  return n;
}


export function sopsStore(share: Share): SecretsStore {
  const repo = share.path;
  return {
    name: "sops",
    ready: () => existsSync(keyFile()) && recipients(repo).includes(publicKey()),
    list: async () => { const d = join(repo, "secrets", "projects"); return [...(existsSync(envFile(repo, "global")) ? ["global"] : []), ...(existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".env")).map((f) => f.slice(0, -4)).sort() : [])]; },
    async load(name) {
      const f = envFile(repo, name); if (!existsSync(f)) return undefined;
      const values = parseDotenv((await sops(["-d", ...DOTENV, relative(repo, f)], repo)).out);
      return { values, ...stampOf(share, f) };
    },
    async write(name, values) {
      const f = envFile(repo, name); if (!Object.keys(values).length) { rmSync(f, { force: true }); return; }
      mkdirSync(dirname(f), { recursive: true });
      const tmp = join(dirname(f), `.${name.replace(/\//g, "_")}.plain.${process.pid}.env`); writeFileSync(tmp, dumpDotenv(values), { mode: 0o600 });
      try { const p = await sops(["-e", ...DOTENV, "--filename-override", relative(repo, f), relative(repo, tmp)], repo); writeFileSync(f, p.out); } finally { rmSync(tmp, { force: true }); }
    },
  };
}

/** cs secrets init with sops: this machine's age key, its public half published in the share, the first machine as the only recipient. */
export async function init(share: Share) {
  const repo = share.path, m = share.machine;
  if (existsSync(keyFile())) ui.skip(`age key present at ${contract(keyFile())}`); else { keygen(); ui.ok(`generated age key ${contract(keyFile())} (0600, never synced)`); }
  const pub = publicKey(); const pf = machinePubFile(repo, m.name);
  if (!existsSync(pf) || readFileSync(pf, "utf8").trim() !== pub) { mkdirSync(dirname(pf), { recursive: true }); writeFileSync(pf, pub + "\n"); commit(share, `machines: ${m.name} age.pub`, [pf]); ui.ok(`published ${contract(pf)}`); }
  const recs = recipients(repo);
  if (!recs.length) { writeRecipients(repo, [pub]); commit(share, "secrets: first recipient", [".sops.yaml"]); ui.ok("this is the first machine: registered as the only recipient");
    const hook = join(repo, ".git", "hooks", "pre-commit"), src = join(toolRoot(), "hooks", "pre-commit-secrets-guard.sh"); if (existsSync(src) && !existsSync(hook)) { copyFileSync(src, hook); chmodSync(hook, 0o755); ui.ok("installed pre-commit plaintext guard in the share"); } }
  else if (recs.includes(pub)) ui.ok("this machine can decrypt secrets"); else ui.step("this machine is not a recipient yet");
  mkdirSync(join(repo, "secrets", "projects"), { recursive: true });
}
/** cs secrets edit: the entry in $EDITOR through sops (a missing entry starts with an example line). Interactive — the terminal is sops's. */
export async function edit(share: Share, name: string) {
  const repo = share.path, f = envFile(repo, name);
  if (!existsSync(f)) await sopsStore(share).write(name, { EXAMPLE_KEY: "value" } satisfies Values);
  spawnSync(exe("sops"), [...DOTENV, relative(repo, f)], { cwd: repo, env: env(), stdio: "inherit" });
}
/** cs secrets status: the key, whether this machine is a recipient, who else is, which entries exist. */
export function status(share: Share) {
  const repo = share.path, m = share.machine;
  const pub = publicKey(), recs = recipients(repo);
  ui.kv("age key", contract(keyFile()) + (existsSync(keyFile()) ? "" : ui.red("  missing")));
  ui.kv("recipient", pub && recs.includes(pub) ? ui.green("yes") : ui.red("no — cs trust " + m.name));
  const names: Record<string, string> = {}; const md = join(repo, "machines"); if (existsSync(md)) for (const d of readdirSync(md)) { const pf = join(md, d, "age.pub"); if (existsSync(pf)) names[readFileSync(pf, "utf8").trim()] = d; }
  ui.kv("recipients", recs.map((r) => names[r] ?? r.slice(0, 14) + "…").join(", ") || "-");
  ui.kv("files", envFiles(join(repo, "secrets")).map((f) => relative(repo, f)).join(", ") || "-");
}
