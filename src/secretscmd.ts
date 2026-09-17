/** cs secrets …, cs trust, cs untrust */
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import * as git from "./git.js";
import { contract, home } from "./paths.js";
import { which } from "./deps.js";
import { commit, projectForPath, workspace, type Share } from "./share.js";
import { checkoutRoot } from "./checkout.js";
import { dumpDotenv, envFile, getBackend, parseDotenv } from "./secrets/index.js";
import * as S from "./secrets/sops.js";
import * as ui from "./ui.js";

const mask = (v: string) => (v.length > 8 ? v.slice(0, 3) + "…" + v.slice(-2) : "…");
const commitSecrets = (share: Share, msg: string) => commit(share, msg, ["secrets"]);
const checkIgnored = (root: string, f: string) => { if (git.isRepo(root) && git.git(["check-ignore", "-q", f], root, { check: false }).code !== 0) ui.warn(`${relative(root, f)} is NOT gitignored in ${contract(root)} — add it to .gitignore`); };

export async function init(share: Share, interactive = true) { await (await getBackend(share.machine)).init(share, interactive); return 0; }
export async function status(share: Share) { ui.info(ui.bold(`secrets backend: ${share.machine.secretsBackend}`)); (await getBackend(share.machine)).status(share); return 0; }
export async function edit(share: Share, name: string) { (await getBackend(share.machine)).edit(share.path, name); commitSecrets(share, `secrets: edit ${name}`); return 0; }
export async function setValues(share: Share, name: string, pairs: string[]) {
  const repo = share.path; const b = await getBackend(share.machine);
  await ui.spin(`encrypting ${name}…`, async () => { const v = b.loadEnv(repo, name);
    for (const p of pairs) { const i = p.indexOf("="); if (i < 1) throw new Error(`cs: expected KEY=VALUE, got '${p}'`); v[p.slice(0, i).trim()] = p.slice(i + 1); }
    b.writeEnv(repo, name, v); commitSecrets(share, `secrets: set ${pairs.length} value(s) in ${name}`); });
  ui.ok(`${name}: ${pairs.map((p) => p.split("=")[0]).join(", ")} stored (encrypted)`); return 0;
}
export async function unsetValues(share: Share, name: string, keys: string[]) { const repo = share.path; const b = await getBackend(share.machine); const v = b.loadEnv(repo, name); for (const k of keys) delete v[k]; b.writeEnv(repo, name, v); commitSecrets(share, `secrets: unset ${keys.length} value(s) in ${name}`); return 0; }
export async function get(share: Share, name: string, key: string | undefined, show: boolean) {
  const v = (await getBackend(share.machine)).loadEnv(share.path, name);
  if (key) { if (!(key in v)) return 1; console.log(show ? v[key] : mask(v[key])); return 0; }
  for (const [k, val] of Object.entries(v)) console.log(`${k}=${show ? val : mask(val)}`); return 0;
}
export async function pull(share: Share, project: string, force: boolean) {
  const repo = share.path, m = share.machine; const p = share.manifest.projects[project]; if (!p) throw new Error(`cs: unknown project '${project}'`);
  const v = (await getBackend(m)).loadEnv(repo, project); if (!Object.keys(v).length) { ui.warn(`no secrets stored for ${project} (cs secrets push ${project} / cs secrets set ${project} K=V)`); return 1; }
  const root = checkoutRoot(p, workspace(share)), target = join(root, ".env"), text = dumpDotenv(v);
  if (existsSync(target) && readFileSync(target, "utf8") !== text && !force) { ui.fail(`${contract(target)} exists and differs — cs secrets diff ${project}; use --force to overwrite`); return 1; }
  writeFileSync(target, text); chmodSync(target, 0o600); checkIgnored(root, target); ui.ok(`wrote ${contract(target)} (${Object.keys(v).length} keys)`); return 0;
}
export async function push(share: Share, project: string) {
  const repo = share.path, m = share.machine; const p = share.manifest.projects[project]; if (!p) throw new Error(`cs: unknown project '${project}'`);
  const root = checkoutRoot(p, workspace(share)), src = join(root, ".env"); if (!existsSync(src)) throw new Error(`cs: ${contract(src)} not found`);
  const v = parseDotenv(readFileSync(src, "utf8")); (await getBackend(m)).writeEnv(repo, project, v); commitSecrets(share, `secrets: ${project} .env`); checkIgnored(root, src);
  ui.ok(`${project}: ${Object.keys(v).length} keys encrypted into ${contract(envFile(repo, project))}`); return 0;
}
export async function diff(share: Share, project: string) {
  const p = share.manifest.projects[project]; if (!p) throw new Error(`cs: unknown project '${project}'`);
  const stored = (await getBackend(share.machine)).loadEnv(share.path, project); const lf = join(checkoutRoot(p, workspace(share)), ".env"); const local = existsSync(lf) ? parseDotenv(readFileSync(lf, "utf8")) : {};
  const rows = [...new Set([...Object.keys(stored), ...Object.keys(local)])].sort().filter((k) => stored[k] !== local[k]).map((k) => [k, k in stored ? mask(stored[k]) : ui.dim("-"), k in local ? mask(local[k]) : ui.dim("-")]);
  if (rows.length) { ui.table(rows, ["key", "stored", "local .env"]); return 1; } ui.ok("no differences"); return 0;
}
export async function environment(share: Share, project?: string, warnMissing = true): Promise<NodeJS.ProcessEnv> {
  const env = { ...process.env }; if (env.CS_SECRETS_LOADED === "1") return env;
  const repo = share.path; const b = await getBackend(share.machine);
  if (b.name !== "none" && !b.ready(repo)) { if (warnMissing) ui.warn("secrets not available on this machine (cs secrets init / cs trust) — continuing without them"); return env; }
  Object.assign(env, b.loadEnv(repo, "global")); if (project) Object.assign(env, b.loadEnv(repo, project)); env.CS_SECRETS_LOADED = "1"; return env;
}
export async function exec(share: Share, project: string | undefined, cmd: string[]): Promise<number> {
  if (!cmd.length) throw new Error("cs: secrets exec needs a command after --");
  project ??= projectForPath(share, process.cwd())?.name;
  const env = await environment(share, project);
  const p = spawnSync(cmd[0], cmd.slice(1), { stdio: "inherit", env }); return p.status ?? 1;
}
export async function trust(share: Share, machine: string) {
  const repo = share.path; const pf = S.machinePubFile(repo, machine); if (!existsSync(pf)) throw new Error(`cs: ${contract(pf)} not found — run cs secrets init on ${machine} and cs sync on both sides first`);
  const pub = readFileSync(pf, "utf8").trim(); const recs = S.recipients(repo); if (recs.includes(pub)) { ui.ok(`${machine} is already a recipient`); return 0; }
  S.writeRecipients(repo, [...recs, pub]); const n = await ui.spin("re-encrypting secrets for the new recipient…", () => S.updatekeys(repo)); commit(share, `secrets: trust ${machine}`, [".sops.yaml", "secrets"]);
  ui.ok(`${machine} can now decrypt  ${ui.dim(`${n} file(s) re-encrypted`)}`); return 0;
}
export async function untrust(share: Share, machine: string) {
  const repo = share.path, m = share.machine; const pf = S.machinePubFile(repo, machine); const pub = existsSync(pf) ? readFileSync(pf, "utf8").trim() : ""; const recs = S.recipients(repo);
  if (pub && recs.includes(pub)) { S.writeRecipients(repo, recs.filter((r) => r !== pub)); const n = await ui.spin("re-encrypting secrets without that machine…", () => S.updatekeys(repo)); rmSync(join(repo, "machines", machine), { recursive: true, force: true });
    commit(share, `secrets: untrust ${machine}`, [".sops.yaml", "secrets", "machines"]); ui.ok(`untrusted ${machine}; re-encrypted ${n} file(s)`); }
  else ui.warn(`${machine} was not a recipient`);
  const b = await getBackend(m); const keys = new Set<string>();
  for (const name of ["global", ...Object.keys(man_projects(repo))]) for (const k of Object.keys(b.loadEnv(repo, name))) keys.add(k);
  if (keys.size) ui.warn("that machine could read these — rotate them at the source: " + [...keys].sort().join(", ")); return 0;
}
function man_projects(repo: string): Record<string, true> { const d = join(repo, "secrets", "projects"); const out: Record<string, true> = {}; if (existsSync(d)) for (const f of readdirSync(d)) if (f.endsWith(".env")) out[f.slice(0, -4)] = true; return out; }
export async function recovery(share: Share) {
  const repo = share.path; const tmp = join(home(), ".cache", `cs-recovery-${process.pid}.txt`); const exe = which("age-keygen") || join(home(), ".local", "bin", "age-keygen");
  mkdirSync(join(home(), ".cache"), { recursive: true });
  const p = spawnSync(exe, ["-o", tmp], { encoding: "utf8" }); if (p.status !== 0) throw new Error(`cs: age-keygen failed: ${(p.stderr || "").trim()}`);
  const text = readFileSync(tmp, "utf8"); rmSync(tmp, { force: true });
  const pub = text.split("\n").find((l) => l.startsWith("# public key:"))!.split(":")[1].trim(); const priv = text.split("\n").find((l) => l.startsWith("AGE-SECRET-KEY-"))!;
  const pf = S.machinePubFile(repo, "recovery"); mkdirSync(join(repo, "machines", "recovery"), { recursive: true }); writeFileSync(pf, pub + "\n");
  S.writeRecipients(repo, [...S.recipients(repo), pub]); const n = await S.updatekeys(repo); commit(share, "secrets: recovery recipient", [".sops.yaml", "secrets", "machines/recovery"]);
  ui.ok(`recovery recipient added; re-encrypted ${n} file(s)`); ui.note([priv, "", ui.dim("On a bare machine: write it to ~/.config/sops/age/keys.txt, run cs secrets init, trust the machine's own key, delete it.")], "Store this in your password manager now — it is not saved anywhere else");
  return 0;
}

/** Wizard step: make sure this machine can decrypt — trust from another machine, or self-trust with the recovery key. */
export async function ensureRecipient(share: Share, interactive: boolean): Promise<boolean> {
  const repo = share.path, m = share.machine; const b = await getBackend(m); if (b.name === "none" || b.ready(repo)) return true;
  const { existsSync: ex, readdirSync: rd } = await import("node:fs");
  const md = join(repo, "machines");
  const others = ex(md) ? rd(md).filter((d) => d !== m.name && d !== "recovery" && S.recipients(repo).includes((() => { try { return readFileSync(join(md, d, "age.pub"), "utf8").trim(); } catch { return ""; } })())) : [];
  const where = others.length ? `on ${others.map((x) => ui.bold(x)).join(" or ")}` : "on a machine that already has secrets";
  if (!interactive) { ui.warn(`secrets: not a recipient yet — ${where}: cs sync && cs trust ${m.name} && cs sync; then cs sync here`); return false; }
  for (;;) {
    const choice = await ui.select("This machine cannot decrypt secrets yet. How do you want to enable it?", [
      { value: "trust", label: "Trust it from another machine", hint: "recommended — nothing secret is typed or copied" },
      { value: "recovery", label: "Use the recovery key", hint: "paste it once; it is discarded afterwards" },
      { value: "skip", label: "Skip for now", hint: "Claude runs without secrets until then" },
    ]);
    if (choice === "skip") return false;
    if (choice === "recovery") {
      const priv = await ui.password("recovery key (AGE-SECRET-KEY-…)");
      if (!/^AGE-SECRET-KEY-1[A-Z0-9]+$/.test(priv.trim())) { ui.warn("that does not look like an age secret key"); continue; }
      const tmp = join(home(), ".cache", `cs-recovery-${process.pid}.txt`); (await import("node:fs")).mkdirSync(join(home(), ".cache"), { recursive: true });
      writeFileSync(tmp, priv.trim() + "\n", { mode: 0o600 });
      const prev = process.env.SOPS_AGE_KEY_FILE; process.env.SOPS_AGE_KEY_FILE = tmp;
      try {
        const pub = S.publicKey.call(null); // this machine's own public key comes from its own keys file, not the temp one
        const own = readFileSync(S.machinePubFile(repo, m.name), "utf8").trim();
        if (!S.recipients(repo).includes(own)) S.writeRecipients(repo, [...S.recipients(repo), own]);
        const n = await ui.spin("re-encrypting secrets for this machine…", () => S.updatekeys(repo));
        commit(share, `secrets: trust ${m.name} (recovery key)`, [".sops.yaml", "secrets"]);
        ui.ok(`trusted via the recovery key  ${ui.dim(`${n} file(s) re-encrypted`)}`); void pub;
      } catch (e: any) { ui.fail(`could not trust: ${e.message}`); continue; }
      finally { if (prev === undefined) delete process.env.SOPS_AGE_KEY_FILE; else process.env.SOPS_AGE_KEY_FILE = prev; rmSync(tmp, { force: true }); }
      return b.ready(repo);
    }
    ui.note([`${where} run:`, "", `  ${ui.bold(`cs sync && cs trust ${m.name} && cs sync`)}`, "", ui.dim("that machine re-encrypts the secrets so this one can read them — no secret leaves either machine")], "Trust this machine");
    if (!(await ui.proceed("done on the other machine?", "Done — check now", "Skip for now"))) return false;
    const { syncShare } = await import("./sharesync.js");
    await ui.spin("syncing…", () => syncShare(share, { pullOnly: true, timeout: 20 }));
    if (b.ready(repo)) { ui.ok("this machine can decrypt secrets"); return true; }
    ui.warn("still not a recipient — did the other machine run cs sync after trusting it?");
  }
}
