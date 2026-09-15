/** sops + age: per-machine key ~/.config/sops/age/keys.txt; public keys in machines/<m>/age.pub; recipients in .sops.yaml. */
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import * as git from "../git.js";
import { contract, home, toolRoot } from "../paths.js";
import { which } from "../deps.js";
import type { Machine } from "../config.js";
import { dumpDotenv, envFile, parseDotenv, type Backend } from "./index.js";
import * as ui from "../ui.js";

const RULE = "^secrets/.*\\.env$";
export const keyFile = () => process.env.SOPS_AGE_KEY_FILE || join(home(), ".config", "sops", "age", "keys.txt");
const env = () => { const e: NodeJS.ProcessEnv = { ...process.env, SOPS_AGE_KEY_FILE: keyFile() }; delete e.SOPS_AGE_RECIPIENTS; return e; };
const exe = (n: string) => which(n) || join(home(), ".local", "bin", n);
function sops(args: string[], repo: string, input?: string, check = true) {
  const p = spawnSync(exe("sops"), args, { cwd: repo, env: env(), encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"] });
  if (check && p.status !== 0) throw new Error(`cs: sops ${args.join(" ")} failed: ${(p.stderr ?? "").trim()}`);
  return p;
}
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
  writeFileSync(join(repo, ".sops.yaml"), `# sops recipients — managed by cs secrets init / cs enroll / cs revoke\ncreation_rules:\n  - path_regex: ${RULE}\n    age: >-\n` + recs.map((r) => `      ${r}`).join(",\n") + "\n");
}
export const machinePubFile = (repo: string, machine: string) => join(repo, "machines", machine, "age.pub");
const isEncrypted = (f: string) => { try { return readFileSync(f, "utf8").includes("sops_version="); } catch { return false; } };
function envFiles(repo: string): string[] { const out: string[] = []; const rec = (d: string) => { if (!existsSync(d)) return; for (const e of readdirSync(d, { withFileTypes: true })) { const f = join(d, e.name); e.isDirectory() ? rec(f) : f.endsWith(".env") && out.push(f); } }; rec(join(repo, "secrets")); return out.sort(); }
export async function updatekeys(repo: string): Promise<number> {
  const { exec } = await import("../proc.js"); let n = 0;
  for (const f of envFiles(repo)) if (isEncrypted(f)) { const p = await exec(exe("sops"), ["updatekeys", "-y", relative(repo, f)], { cwd: repo, env: env() }); if (p.code !== 0) throw new Error(`cs: sops updatekeys failed: ${p.err}`); n++; }
  return n;
}

export const SopsBackend: Backend = {
  name: "sops",
  async init(repo, m) {
    if (existsSync(keyFile())) ui.skip(`age key present at ${contract(keyFile())}`); else { keygen(); ui.ok(`generated age key ${contract(keyFile())} (0600, never synced)`); }
    const pub = publicKey(); const pf = machinePubFile(repo, m.name);
    if (!existsSync(pf) || readFileSync(pf, "utf8").trim() !== pub) { mkdirSync(dirname(pf), { recursive: true }); writeFileSync(pf, pub + "\n"); git.git(["add", relative(repo, pf)], repo); git.commit(repo, `machines: ${m.name} age.pub`, "cs", `cs@${m.name}`); ui.ok(`published ${contract(pf)}`); }
    const recs = recipients(repo);
    if (!recs.length) { writeRecipients(repo, [pub]); git.git(["add", ".sops.yaml"], repo); git.commit(repo, "secrets: first recipient", "cs", `cs@${m.name}`); ui.ok("this is the first machine: registered as the only recipient");
      const hook = join(repo, ".git", "hooks", "pre-commit"), src = join(toolRoot(), "hooks", "pre-commit-secrets-guard.sh"); if (existsSync(src) && !existsSync(hook)) { copyFileSync(src, hook); chmodSync(hook, 0o755); ui.ok("installed pre-commit plaintext guard in the config repo"); } }
    else if (recs.includes(pub)) ui.ok("this machine can decrypt secrets"); else ui.step("this machine is not a recipient yet");
    mkdirSync(join(repo, "secrets", "projects"), { recursive: true });
  },
  ready: (repo) => existsSync(keyFile()) && recipients(repo).includes(publicKey()),
  loadEnv(repo, name) { const f = envFile(repo, name); if (!existsSync(f)) return {}; return parseDotenv(sops(["-d", "--input-type", "dotenv", "--output-type", "dotenv", relative(repo, f)], repo).stdout); },
  writeEnv(repo, name, values) { const f = envFile(repo, name); mkdirSync(dirname(f), { recursive: true }); const rel = relative(repo, f);
    const tmp = join(dirname(f), `.${name.replace(/\//g, "_")}.plain.${process.pid}.env`); writeFileSync(tmp, dumpDotenv(values), { mode: 0o600 });
    try { const p = sops(["-e", "--input-type", "dotenv", "--output-type", "dotenv", "--filename-override", rel, relative(repo, tmp)], repo); writeFileSync(f, p.stdout); } finally { rmSync(tmp, { force: true }); }
    return f; },
  edit(repo, name) { const f = envFile(repo, name); if (!existsSync(f)) this.writeEnv(repo, name, { EXAMPLE_KEY: "value" }); spawnSync(exe("sops"), ["--input-type", "dotenv", "--output-type", "dotenv", relative(repo, f)], { cwd: repo, env: env(), stdio: "inherit" }); },
  status(repo, m) {
    const pub = publicKey(), recs = recipients(repo);
    ui.kv("age key", contract(keyFile()) + (existsSync(keyFile()) ? "" : ui.red("  missing")));
    ui.kv("recipient", pub && recs.includes(pub) ? ui.green("yes") : ui.red("no — cs enroll " + m.name));
    const names: Record<string, string> = {}; const md = join(repo, "machines"); if (existsSync(md)) for (const d of readdirSync(md)) { const pf = join(md, d, "age.pub"); if (existsSync(pf)) names[readFileSync(pf, "utf8").trim()] = d; }
    ui.kv("recipients", recs.map((r) => names[r] ?? r.slice(0, 14) + "…").join(", ") || "-");
    ui.kv("files", envFiles(repo).map((f) => relative(repo, f)).join(", ") || "-");
  },
};
