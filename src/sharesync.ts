/** share sync: commit → fetch → ff/rebase (union attrs) → on conflict abort + blocked marker → push. */
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as git from "./git.js";
import { contract, stateDir } from "./paths.js";
import type { Machine } from "./machine.js";
import { loadManifest, selectedProjects, workspace, type Manifest } from "./manifest.js";
import { runApply } from "./apply.js";
import { checkouts, runLink, syncProject } from "./link.js";
import * as ui from "./ui.js";

const marker = (label: string) => join(stateDir(), `blocked-${label}`);
const lockFile = (label: string) => join(stateDir(), `sync-${label}.lock`);
function tryLock(label: string): number | undefined {
  mkdirSync(stateDir(), { recursive: true });
  try { return openSync(lockFile(label), "wx"); } catch {
    try { if (Date.now() - statSync(lockFile(label)).mtimeMs > 10 * 60 * 1000) { unlinkSync(lockFile(label)); return openSync(lockFile(label), "wx"); } } catch {}
    return undefined;
  }
}
const unlock = (label: string, fd: number) => { closeSync(fd); try { unlinkSync(lockFile(label)); } catch {} };

/** `commitOnly`: commit local changes and stop (cs sync when the first fetch of the run already failed). */
export interface SyncOpts { pullOnly?: boolean; pushOnly?: boolean; timeout?: number; resolve?: "ours" | "theirs"; commitOnly?: boolean }
export interface ShareResult { ok: boolean; offline?: boolean; pushed?: number }
/** `offline`: the fetch failed, local commits are kept for a later push. `pushed`: commits that reached the remote. */
export async function shareGitSync(repo: string, label: string, machine: string, o: SyncOpts = {}): Promise<ShareResult> {
  if (!git.isRepo(repo)) { ui.warn(`${label}: not a git repo (${contract(repo)})`); return { ok: false }; }
  const timeout = o.timeout ?? 20;
  if (existsSync(marker(label)) && !o.resolve) { ui.fail(`${label}: sync blocked by an earlier conflict — ${readFileSync(marker(label), "utf8").trim()}`); return { ok: false }; }
  const fd = tryLock(label); if (fd === undefined) { ui.info(`${label}: another sync is running, skipping`); return { ok: true }; }
  try {
    if (!o.pullOnly && git.isDirty(repo)) { const n = git.dirtyCount(repo); git.git(["add", "-A"], repo); git.commit(repo, `sync(${machine}): ${n} file(s) ${new Date().toISOString().slice(0, 16).replace("T", " ")}`, "cs", `cs@${machine}`); ui.step(`${label}: committed ${n} change(s)`); }
    if (!git.remoteUrl(repo)) { ui.ok(`${label}: no remote configured; local only`); return { ok: true }; }
    if (o.commitOnly) return { ok: true, offline: true };
    const f = await ui.spin(`${label}: fetching…`, () => git.gitA(["fetch", "-q", "--prune", "origin"], repo, { check: false, timeout }));
    if (f.code !== 0) { ui.warn(`${label}: offline or fetch timed out; will push later`); writeFileSync(join(stateDir(), `last-${label}`), "offline\n"); return { ok: true, offline: true }; }
    const branch = git.currentBranch(repo); if (!branch) { ui.fail(`${label}: detached HEAD; refusing to sync`); return { ok: false }; }
    if (!git.out(["rev-parse", "--abbrev-ref", "@{upstream}"], repo)) {
      if (git.out(["rev-parse", "--verify", "-q", `origin/${branch}`], repo)) git.git(["branch", "-q", `--set-upstream-to=origin/${branch}`, branch], repo);
      else if (!o.pullOnly) { await ui.spin(`${label}: pushing…`, () => git.gitA(["push", "-q", "-u", "origin", branch], repo, { timeout })); ui.ok(`${label}: pushed new branch ${branch}`); return { ok: true, pushed: 1 }; }
      else return { ok: true };
    }
    let [ahead, behind] = git.aheadBehind(repo) ?? [0, 0];
    if (behind && !o.pushOnly) {
      if (!ahead) { git.git(["merge", "-q", "--ff-only", "@{upstream}"], repo); ui.step(`${label}: fast-forwarded ${behind} commit(s)`); }
      else {
        const args = ["rebase", "-q", ...(o.resolve === "ours" ? ["-X", "theirs"] : o.resolve === "theirs" ? ["-X", "ours"] : []), "@{upstream}"];
        const r = git.git(args, repo, { check: false });
        if (r.code !== 0) {
          const conflicts = git.out(["diff", "--name-only", "--diff-filter=U"], repo).split("\n").filter(Boolean).join(", ");
          git.git(["rebase", "--abort"], repo, { check: false });
          writeFileSync(marker(label), `conflict in: ${conflicts || "unknown"}\n`);
          ui.error(`${label}: conflict in ${conflicts}`, "", `keep mine: cs sync --resolve ours · keep theirs: cs sync --resolve theirs · manual: cd ${contract(repo)} && git rebase origin/${branch}`);
          return { ok: false };
        }
        ui.step(`${label}: rebased ${ahead} local commit(s) onto ${behind} remote commit(s)`);
      }
    }
    if (existsSync(marker(label))) unlinkSync(marker(label));
    let pushed = 0;
    if (!o.pullOnly) { const ab = git.aheadBehind(repo); if (ab && ab[0]) { const pr = await ui.spin(`${label}: pushing…`, () => git.gitA(["push", "-q", "origin", branch], repo, { check: false, timeout }));
      if (pr.code !== 0) { ui.warn(`${label}: push rejected, retrying once`); unlock(label, fd); return shareGitSync(repo, label, machine, o); } pushed = ab[0]; ui.ok(`${label}: pushed ${ab[0]} commit(s)`); } }
    writeFileSync(join(stateDir(), `last-${label}`), new Date().toISOString() + "\n");
    return { ok: true, pushed };
  } finally { try { unlock(label, fd); } catch {} }
}
export async function runShareSync(repo: string, m: Machine, man: Manifest, o: SyncOpts & { debounce?: number } = {}): Promise<number> {
  const ws = workspace(man, m); let rc = 0;
  if (o.debounce) { const last = join(stateDir(), "last-config"); if (existsSync(last) && Date.now() - statSync(last).mtimeMs < o.debounce * 1000) return 0; }
  const before = git.out(["rev-parse", "HEAD"], repo);
  if (!o.pullOnly) for (const p of selectedProjects(man, m)) if (checkouts(p, ws).length) syncProject(repo, p, ws);
  if (!(await shareGitSync(repo, "config", m.name, o)).ok) rc = 2;
  const after = git.out(["rev-parse", "HEAD"], repo);
  if (after !== before || o.pullOnly) {
    const changed = before ? git.out(["diff", "--name-only", before, after], repo) : "";
    if (o.pullOnly || changed.split("\n").some((x) => x.startsWith("claude/") || x.startsWith("projects.toml") || x.startsWith("plans/"))) runApply(repo, m, man);
    runLink(repo, m, loadManifest(repo));
  }
  return rc;
}
