/** cs secrets …, cs enroll, cs revoke */
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import * as git from "./git.js";
import { contract, home } from "./paths.js";
import { which } from "./deps.js";
import type { Machine } from "./config.js";
import { checkoutRoot, projectForPath, workspace, type Manifest } from "./manifest.js";
import { dumpDotenv, envFile, getBackend, parseDotenv } from "./secrets/index.js";
import * as S from "./secrets/sops.js";
import * as ui from "./ui.js";

const mask = (v: string) => (v.length > 8 ? v.slice(0, 3) + "…" + v.slice(-2) : "…");
const commitSecrets = (repo: string, m: Machine, msg: string) => { if (git.isRepo(repo) && git.isDirty(repo)) { git.git(["add", "-A", "secrets"], repo); git.commit(repo, msg, "cs", `cs@${m.name}`); } };
const checkIgnored = (root: string, f: string) => { if (git.isRepo(root) && git.git(["check-ignore", "-q", f], root, { check: false }).code !== 0) ui.warn(`${relative(root, f)} is NOT gitignored in ${contract(root)} — add it to .gitignore`); };

export async function init(repo: string, m: Machine, interactive = true) { await (await getBackend(m)).init(repo, m, interactive); return 0; }
export async function status(repo: string, m: Machine) { ui.info(ui.bold(`secrets backend: ${m.secretsBackend}`)); (await getBackend(m)).status(repo, m); return 0; }
export async function edit(repo: string, m: Machine, name: string) { (await getBackend(m)).edit(repo, name); commitSecrets(repo, m, `secrets: edit ${name}`); return 0; }
export async function setValues(repo: string, m: Machine, name: string, pairs: string[]) {
  const b = await getBackend(m);
  await ui.spin(`encrypting ${name}…`, async () => { const v = b.loadEnv(repo, name);
    for (const p of pairs) { const i = p.indexOf("="); if (i < 1) throw new Error(`cs: expected KEY=VALUE, got '${p}'`); v[p.slice(0, i).trim()] = p.slice(i + 1); }
    b.writeEnv(repo, name, v); commitSecrets(repo, m, `secrets: set ${pairs.length} value(s) in ${name}`); });
  ui.ok(`${name}: ${pairs.map((p) => p.split("=")[0]).join(", ")} stored (encrypted)`); return 0;
}
export async function unsetValues(repo: string, m: Machine, name: string, keys: string[]) { const b = await getBackend(m); const v = b.loadEnv(repo, name); for (const k of keys) delete v[k]; b.writeEnv(repo, name, v); commitSecrets(repo, m, `secrets: unset ${keys.length} value(s) in ${name}`); return 0; }
export async function get(repo: string, m: Machine, name: string, key: string | undefined, show: boolean) {
  const v = (await getBackend(m)).loadEnv(repo, name);
  if (key) { if (!(key in v)) return 1; console.log(show ? v[key] : mask(v[key])); return 0; }
  for (const [k, val] of Object.entries(v)) console.log(`${k}=${show ? val : mask(val)}`); return 0;
}
export async function pull(repo: string, m: Machine, man: Manifest, project: string, force: boolean) {
  const p = man.projects[project]; if (!p) throw new Error(`cs: unknown project '${project}'`);
  const v = (await getBackend(m)).loadEnv(repo, project); if (!Object.keys(v).length) { ui.warn(`no secrets stored for ${project} (cs secrets push ${project} / cs secrets set ${project} K=V)`); return 1; }
  const root = checkoutRoot(p, workspace(man, m)), target = join(root, ".env"), text = dumpDotenv(v);
  if (existsSync(target) && readFileSync(target, "utf8") !== text && !force) { ui.fail(`${contract(target)} exists and differs — cs secrets diff ${project}; use --force to overwrite`); return 1; }
  writeFileSync(target, text); chmodSync(target, 0o600); checkIgnored(root, target); ui.ok(`wrote ${contract(target)} (${Object.keys(v).length} keys)`); return 0;
}
export async function push(repo: string, m: Machine, man: Manifest, project: string) {
  const p = man.projects[project]; if (!p) throw new Error(`cs: unknown project '${project}'`);
  const root = checkoutRoot(p, workspace(man, m)), src = join(root, ".env"); if (!existsSync(src)) throw new Error(`cs: ${contract(src)} not found`);
  const v = parseDotenv(readFileSync(src, "utf8")); (await getBackend(m)).writeEnv(repo, project, v); commitSecrets(repo, m, `secrets: ${project} .env`); checkIgnored(root, src);
  ui.ok(`${project}: ${Object.keys(v).length} keys encrypted into ${contract(envFile(repo, project))}`); return 0;
}
export async function diff(repo: string, m: Machine, man: Manifest, project: string) {
  const p = man.projects[project]; if (!p) throw new Error(`cs: unknown project '${project}'`);
  const stored = (await getBackend(m)).loadEnv(repo, project); const lf = join(checkoutRoot(p, workspace(man, m)), ".env"); const local = existsSync(lf) ? parseDotenv(readFileSync(lf, "utf8")) : {};
  const rows = [...new Set([...Object.keys(stored), ...Object.keys(local)])].sort().filter((k) => stored[k] !== local[k]).map((k) => [k, k in stored ? mask(stored[k]) : ui.dim("-"), k in local ? mask(local[k]) : ui.dim("-")]);
  if (rows.length) { ui.table(rows, ["key", "stored", "local .env"]); return 1; } ui.ok("no differences"); return 0;
}
export async function environment(repo: string, m: Machine, man: Manifest, project?: string, warnMissing = true): Promise<NodeJS.ProcessEnv> {
  const env = { ...process.env }; if (env.CS_SECRETS_LOADED === "1") return env;
  const b = await getBackend(m);
  if (b.name !== "none" && !b.ready(repo)) { if (warnMissing) ui.warn("secrets not available on this machine (cs secrets init / cs enroll) — continuing without them"); return env; }
  Object.assign(env, b.loadEnv(repo, "global")); if (project) Object.assign(env, b.loadEnv(repo, project)); env.CS_SECRETS_LOADED = "1"; return env;
}
export async function exec(repo: string, m: Machine, man: Manifest, project: string | undefined, cmd: string[]): Promise<number> {
  if (!cmd.length) throw new Error("cs: secrets exec needs a command after --");
  project ??= projectForPath(man, m, process.cwd())?.name;
  const env = await environment(repo, m, man, project);
  const p = spawnSync(cmd[0], cmd.slice(1), { stdio: "inherit", env }); return p.status ?? 1;
}
export async function enroll(repo: string, m: Machine, machine: string) {
  const pf = S.machinePubFile(repo, machine); if (!existsSync(pf)) throw new Error(`cs: ${contract(pf)} not found — run cs secrets init on ${machine} and cs sync on both sides first`);
  const pub = readFileSync(pf, "utf8").trim(); const recs = S.recipients(repo); if (recs.includes(pub)) { ui.ok(`${machine} is already a recipient`); return 0; }
  S.writeRecipients(repo, [...recs, pub]); const n = await ui.spin("re-encrypting secrets for the new recipient…", () => S.updatekeys(repo)); git.git(["add", "-A", ".sops.yaml", "secrets"], repo); git.commit(repo, `secrets: enroll ${machine}`, "cs", `cs@${m.name}`);
  ui.ok(`${machine} can now decrypt  ${ui.dim(`${n} file(s) re-encrypted`)}`); return 0;
}
export async function revoke(repo: string, m: Machine, machine: string) {
  const pf = S.machinePubFile(repo, machine); const pub = existsSync(pf) ? readFileSync(pf, "utf8").trim() : ""; const recs = S.recipients(repo);
  if (pub && recs.includes(pub)) { S.writeRecipients(repo, recs.filter((r) => r !== pub)); const n = await ui.spin("re-encrypting secrets without that machine…", () => S.updatekeys(repo)); rmSync(join(repo, "machines", machine), { recursive: true, force: true });
    git.git(["add", "-A", ".sops.yaml", "secrets", "machines"], repo); git.commit(repo, `secrets: revoke ${machine}`, "cs", `cs@${m.name}`); ui.ok(`revoked ${machine}; re-encrypted ${n} file(s)`); }
  else ui.warn(`${machine} was not a recipient`);
  const b = await getBackend(m); const keys = new Set<string>();
  for (const name of ["global", ...Object.keys(man_projects(repo))]) for (const k of Object.keys(b.loadEnv(repo, name))) keys.add(k);
  if (keys.size) ui.warn("that machine could read these — rotate them at the source: " + [...keys].sort().join(", ")); return 0;
}
function man_projects(repo: string): Record<string, true> { const d = join(repo, "secrets", "projects"); const out: Record<string, true> = {}; if (existsSync(d)) for (const f of readdirSync(d)) if (f.endsWith(".env")) out[f.slice(0, -4)] = true; return out; }
export async function recovery(repo: string, m: Machine) {
  const tmp = join(home(), ".cache", `cs-recovery-${process.pid}.txt`); const exe = which("age-keygen") || join(home(), ".local", "bin", "age-keygen");
  const p = spawnSync(exe, ["-o", tmp], { encoding: "utf8" }); if (p.status !== 0) throw new Error("cs: age-keygen failed");
  const text = readFileSync(tmp, "utf8"); rmSync(tmp, { force: true });
  const pub = text.split("\n").find((l) => l.startsWith("# public key:"))!.split(":")[1].trim(); const priv = text.split("\n").find((l) => l.startsWith("AGE-SECRET-KEY-"))!;
  const pf = S.machinePubFile(repo, "recovery"); mkdirSync(join(repo, "machines", "recovery"), { recursive: true }); writeFileSync(pf, pub + "\n");
  S.writeRecipients(repo, [...S.recipients(repo), pub]); const n = await S.updatekeys(repo); git.git(["add", "-A", ".sops.yaml", "secrets", "machines/recovery"], repo); git.commit(repo, "secrets: recovery recipient", "cs", `cs@${m.name}`);
  ui.ok(`recovery recipient added; re-encrypted ${n} file(s)`); ui.note([priv, "", ui.dim("On a bare machine: write it to ~/.config/sops/age/keys.txt, run cs secrets init, enroll the machine's own key, delete it.")], "Store this in your password manager now — it is not saved anywhere else");
  return 0;
}
