/** cs deps [--install]: prerequisites; user-local installs where possible. */
import { chmodSync, copyFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { arch } from "node:os";
import { home, contract } from "./paths.js";
import * as platform from "./platform.js";
import * as ui from "./ui.js";

const BIN = () => join(home(), ".local", "bin");
export function which(cmd: string): string | undefined {
  for (const d of [...(process.env.PATH ?? "").split(":"), BIN()]) if (d && existsSync(join(d, cmd))) return join(d, cmd);
  return undefined;
}
const ver = (args: string[]) => { const p = spawnSync(args[0], args.slice(1), { encoding: "utf8", timeout: 10000 }); return ((p.stdout || p.stderr || "").split("\n")[0] ?? "").trim(); };
const a64 = () => (["arm64", "aarch64"].includes(arch()) ? "arm64" : "amd64");
async function latest(repo: string) { const r = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { "User-Agent": "claude-share" } }); return (await r.json()).tag_name as string; }
async function download(url: string, dest: string) { const r = await fetch(url, { headers: { "User-Agent": "claude-share" } }); if (!r.ok) throw new Error(`download failed: ${url}`); const { writeFileSync } = await import("node:fs"); writeFileSync(dest, Buffer.from(await r.arrayBuffer())); }
const sh = (cmd: string) => { const p = spawnSync("bash", ["-lc", cmd], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); if (p.status !== 0) throw new Error(`command failed: ${cmd}\n${(p.stderr || p.stdout || "").trim().split("\n").slice(-5).join("\n")}`); };

async function sopsLinux() { const t = await latest("getsops/sops"); mkdirSync(BIN(), { recursive: true }); await download(`https://github.com/getsops/sops/releases/download/${t}/sops-${t}.linux.${a64()}`, join(BIN(), "sops")); chmodSync(join(BIN(), "sops"), 0o755); }
async function ageLinux() { const t = await latest("FiloSottile/age"); const tmp = join(home(), ".cache", "cs-age"); mkdirSync(tmp, { recursive: true }); const tgz = join(tmp, "age.tgz");
  await download(`https://github.com/FiloSottile/age/releases/download/${t}/age-${t}-linux-${a64()}.tar.gz`, tgz); sh(`tar -xzf ${tgz} -C ${tmp}`); mkdirSync(BIN(), { recursive: true });
  for (const n of ["age", "age-keygen"]) { copyFileSync(join(tmp, "age", n), join(BIN(), n)); chmodSync(join(BIN(), n), 0o755); } rmSync(tmp, { recursive: true, force: true }); }
const brew = (pkg: string) => async () => sh(`brew install ${pkg}`);

type Item = { cmd: string; ver: string[]; linux?: () => Promise<void>; mac?: () => Promise<void>; required: boolean; apt?: string };
const CATALOG: Record<string, Item> = {
  git: { cmd: "git", ver: ["git", "--version"], mac: brew("git"), required: true, apt: "git" },
  curl: { cmd: "curl", ver: ["curl", "--version"], required: true, apt: "curl" },
  ssh: { cmd: "ssh", ver: ["ssh", "-V"], required: true, apt: "openssh-client" },
  age: { cmd: "age", ver: ["age", "--version"], linux: ageLinux, mac: brew("age"), required: true },
  sops: { cmd: "sops", ver: ["sops", "--version"], linux: sopsLinux, mac: brew("sops"), required: true },
  node: { cmd: "node", ver: ["node", "--version"], required: true },
  gh: { cmd: "gh", ver: ["gh", "--version"], mac: brew("gh"), required: false, apt: "gh" },
  claude: { cmd: "claude", ver: ["claude", "--version"], linux: async () => sh("curl -fsSL https://claude.ai/install.sh | bash"), mac: async () => sh("curl -fsSL https://claude.ai/install.sh | bash"), required: true },
};
export async function runDeps(install = false, compact = false): Promise<number> {
  const rows: string[][] = []; let missingRequired = false; const apt: string[] = []; const present: string[] = []; const installed: string[] = []; const optional: string[] = [];
  for (const [name, it] of Object.entries(CATALOG)) {
    let path = which(it.cmd);
    if (path) { rows.push([ui.green("✓"), name, ui.dim(ver(it.ver).slice(0, 40))]); present.push(name); continue; }
    const inst = platform.isMac() ? it.mac : it.linux;
    if (install && inst) { try { await ui.spin(`installing ${name}…`, async () => inst()); path = which(it.cmd); } catch (e: any) { ui.warn(`${name}: install failed: ${e.message}`); } }
    if (path) { rows.push([ui.green("✓"), name, ui.dim("installed")]); installed.push(name); continue; }
    if (it.required) missingRequired = true; if (!platform.isMac() && it.apt) apt.push(it.apt);
    if (!it.required) optional.push(name + (it.apt && !platform.isMac() ? ` (sudo apt install -y ${it.apt})` : it.mac ? ` (brew install ${name})` : ""));
    rows.push([it.required ? ui.red("✗") : ui.yellow("!"), name, ui.dim("missing")]);
  }
  if (compact) {
    ui.step(`${present.length + installed.length} tools ready${installed.length ? ` (installed ${installed.join(", ")})` : ""}`);
    if (optional.length) ui.step(`optional: ${optional.join(", ")}`);
    for (const r of rows) if (r[0].includes("✗")) ui.step(`missing: ${r[1]}`);
  } else { ui.table(rows); if (optional.length) ui.info(ui.dim("optional: " + optional.join(", "))); }
  if (missingRequired && apt.length) ui.info(ui.bold("sudo apt install -y " + apt.join(" ")));
  if (!install && !compact && rows.some((r) => !r[0].includes("✓"))) ui.info(ui.dim("cs deps --install  installs the user-local ones (age, sops, claude)"));
  if (!(process.env.PATH ?? "").split(":").includes(BIN())) ui.warn(`${contract(BIN())} is not on PATH (cs apply adds it to your shell rc)`);
  return missingRequired ? 1 : 0;
}
