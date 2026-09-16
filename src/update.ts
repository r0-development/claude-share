/** cs update — the tool updating itself (a git checkout, pulled --ff-only) — and the outdated check every command runs in the
 *  background: at most once a day, a 3-second fetch, never blocking the command it rides on. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as git from "./git.js";
import { stateDir, toolRoot } from "./paths.js";
import * as ui from "./ui.js";

interface UpdateCache { checkedAt: number; behind: number }
const cacheFile = () => join(stateDir(), "update-check.json");
function readCache(): UpdateCache { try { return JSON.parse(readFileSync(cacheFile(), "utf8")); } catch { return { checkedAt: 0, behind: 0 }; } }
function writeCache(c: UpdateCache) { try { mkdirSync(stateDir(), { recursive: true }); writeFileSync(cacheFile(), JSON.stringify(c)); } catch {} }

/** Start the background check; the returned function resolves to how many commits behind origin the tool is (0 when
 *  offline, not a checkout, or checked within the last day). `await finish()` with a short race so a slow fetch never delays the exit. */
export async function startUpdateCheck(): Promise<() => Promise<number>> {
  const root = toolRoot(); const cache = readCache();
  if (process.env.CS_OFFLINE || !git.isRepo(root)) return async () => 0;
  if (Date.now() - cache.checkedAt < 24 * 3600 * 1000) return async () => cache.behind;
  const { exec } = await import("./proc.js");
  const run = exec("git", ["fetch", "-q", "origin"], { cwd: root, timeout: 3 }).then((r) => {
    if (r.code !== 0) return cache.behind;
    const branch = git.currentBranch(root) || "master";
    const behind = parseInt(git.out(["rev-list", "--count", `HEAD..origin/${branch}`], root, "0"), 10) || 0;
    writeCache({ checkedAt: Date.now(), behind }); return behind;
  }).catch(() => 0);
  return () => run;
}
/** What the check found, waited for at most `graceMs`: 0 when it is still running. */
export const behindCount = (finish: () => Promise<number>, graceMs = 50) => Promise.race([finish(), new Promise<number>((r) => setTimeout(() => r(0), graceMs))]);
/** The one-line hint every command ends with when the tool is behind. */
export const behindHint = (behind: number) => (behind > 0 ? ui.yellow(`cs is ${behind} commit(s) behind — run ${ui.bold("cs update")}`) : "");

/** Pull the tool's own checkout fast-forward and say what changed. Throws when the checkout is missing or the pull fails. */
export async function runUpdate(): Promise<void> {
  const root = toolRoot(); if (!git.isRepo(root)) throw new Error(`cs: ${root} is not a git checkout`);
  const before = git.out(["rev-parse", "--short", "HEAD"], root);
  const r = await ui.spin("checking for updates…", () => git.gitA(["pull", "-q", "--ff-only"], root, { check: false, timeout: 60 }));
  if (r.code !== 0) throw new Error(`cs: update failed\n${r.err}`);
  const after = git.out(["rev-parse", "--short", "HEAD"], root);
  if (before === after) ui.ok(`already up to date  ${ui.dim(`(${after})`)}`);
  else { const n = git.out(["rev-list", "--count", `${before}..${after}`], root); ui.ok(`updated ${before} → ${after}  ${ui.dim(`${n} commit(s)`)}`); for (const l of git.out(["log", "--format=%s", `${before}..${after}`], root).split("\n").slice(0, 8)) ui.info(ui.dim("• " + l)); }
  writeCache({ checkedAt: Date.now(), behind: 0 });
}
