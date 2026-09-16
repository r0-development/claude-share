/** .env files, the I/O half of src/env.ts: observe a project's files — here, stored in the share's secrets area, and the
 *  last-synced snapshot of this machine — and apply a merge. cs sync's gather step observes; its env step applies what
 *  the plan screen confirmed. Values only ever reach the share through the secrets backend (encrypted). */
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import * as git from "./git.js";
import { stateDir } from "./paths.js";
import type { Project } from "./manifest.js";
import { dumpDotenv, envFile, parseDotenv, type Backend } from "./secrets/index.js";
import { classify, fileOf, isEnvName, merge3, patchDotenv, storeName, type EnvKind, type Merge, type Side, type Values } from "./env.js";

/** One `.env*` file of a project: both sides as observed, the snapshot, and the merge they imply (before any decision). */
export interface EnvState {
  project: string; file: string; kind: EnvKind; name: string; path: string;
  local?: Values; localText: string; localWhen?: string;
  stored?: Values; storedWhen?: string; storedFrom?: string;
  base?: Values; merge: Merge;
}

const snapshotFile = (project: string, file: string) => join(stateDir(), "env", project, file);
const readValues = (f: string): Values | undefined => (existsSync(f) ? parseDotenv(readFileSync(f, "utf8")) : undefined);
const mtime = (f: string) => new Date(statSync(f).mtimeMs).toISOString();

/** Stored entries of `project` in the share, as file names (`.env`, `.env.production`); an entry that is another project's name is not one of ours. */
function storedFiles(repo: string, project: string, others: Set<string>): string[] {
  const d = join(repo, "secrets", "projects"); if (!existsSync(d)) return [];
  return readdirSync(d).filter((n) => n.endsWith(".env")).map((n) => n.slice(0, -4)).filter((e) => !others.has(e) || e === project).map((e) => fileOf(project, e)).filter((f): f is string => !!f);
}
/** When and from which machine the stored entry was last committed — the share's sync commits are titled `sync(<machine>): …`
 *  (and authored cs@<machine> when git has no identity there); uncommitted → its mtime, no machine. */
function storedStamp(repo: string, f: string): { when: string; from?: string } {
  const [when, subject, email] = git.out(["log", "-1", "--format=%cI%n%s%n%ae", "--", relative(repo, f)], repo).split("\n");
  if (when && git.git(["diff", "--quiet", "--", relative(repo, f)], repo, { check: false }).code === 0)
    return { when, from: subject?.match(/^sync\(([^)]+)\):/)?.[1] ?? (email?.startsWith("cs@") ? email.slice(3) : undefined) };
  return { when: mtime(f) };
}

/** Observe every `.env*` file the project has here or in the share. `env = false` projects are never observed (the caller skips them).
 *  A side that has no file at all (fresh checkout, entry dropped from the share) is merged without the snapshot: the other
 *  side's keys are pulled or stored again — a whole file is never deleted because it is missing on one machine. */
export async function observeEnv(repo: string, b: Backend, p: Project, root: string, others: Set<string>): Promise<EnvState[]> {
  const extraLocal = (p.env && p.env.local) || [];
  const here = existsSync(root) ? readdirSync(root).filter(isEnvName) : [];
  const files = [...new Set([...here, ...storedFiles(repo, p.name, others)])].sort();
  const out: EnvState[] = [];
  for (const file of files) {
    const tracked = git.git(["ls-files", "--error-unmatch", "--", file], root, { check: false }).code === 0;
    const ignored = git.git(["check-ignore", "-q", "--", file], root, { check: false }).code === 0;
    const kind = classify(file, { tracked, ignored }, extraLocal);
    const name = storeName(p.name, file), path = join(root, file), sf = envFile(repo, name);
    const st: EnvState = { project: p.name, file, kind, name, path, localText: "", merge: { result: {}, toLocal: [], toStore: [], conflicts: [] } };
    if (kind !== "values") { out.push(st); continue; }
    if (existsSync(path)) { st.localText = readFileSync(path, "utf8"); st.local = parseDotenv(st.localText); st.localWhen = mtime(path); }
    if (existsSync(sf)) { st.stored = await b.loadEnvA(repo, name); const s = storedStamp(repo, sf); st.storedWhen = s.when; st.storedFrom = s.from; }
    if (st.local && st.stored) st.base = readValues(snapshotFile(p.name, file));
    st.merge = merge3(st.base, st.local ?? {}, st.stored ?? {});
    out.push(st);
  }
  return out;
}

/** Which side is newer — the fallback when a both-changed key cannot be asked. A tie stays with this machine. */
export const newestSide = (st: EnvState): Side => (st.storedWhen && st.localWhen && Date.parse(st.storedWhen) > Date.parse(st.localWhen) ? "stored" : "local");

function writeSnapshot(st: EnvState, values: Values) {
  const f = snapshotFile(st.project, st.file);
  if (!Object.keys(values).length) { rmSync(f, { force: true }); return; }
  mkdirSync(dirname(f), { recursive: true, mode: 0o700 }); writeFileSync(f, dumpDotenv(values), { mode: 0o600 });
}

/** Apply the merge with every conflict decided: the share entry is rewritten (encrypted) when keys change on that side,
 *  the local file is patched in place when keys change here (its previous text kept next to the snapshot as `<file>.prev`),
 *  and the snapshot records the result. Every key removed on both sides → the file goes on both sides. */
export async function applyEnv(repo: string, b: Backend, st: EnvState, decide: Partial<Record<string, Side>>): Promise<{ stored: number; local: number }> {
  const m = merge3(st.base, st.local ?? {}, st.stored ?? {}, decide);
  if (m.conflicts.length) throw new Error(`cs: ${st.project} ${st.file}: undecided keys ${m.conflicts.map((c) => c.key).join(", ")}`);
  const empty = !Object.keys(m.result).length;
  if (m.toStore.length) { if (empty) rmSync(envFile(repo, st.name), { force: true }); else await b.writeEnvA(repo, st.name, m.result); }
  if (m.toLocal.length) {
    if (st.local) { const prev = snapshotFile(st.project, st.file) + ".prev"; mkdirSync(dirname(prev), { recursive: true, mode: 0o700 }); writeFileSync(prev, st.localText, { mode: 0o600 }); }
    if (empty) rmSync(st.path, { force: true });
    else { const fresh = !existsSync(st.path); writeFileSync(st.path, patchDotenv(st.localText, m.result)); if (fresh) chmodSync(st.path, 0o600); }
  }
  writeSnapshot(st, m.result);
  return { stored: m.toStore.length, local: m.toLocal.length };
}
/** The snapshot of a file that is the same on both sides, so the next difference is known to be one-sided — refreshed
 *  every run, since both machines may have made the same change independently. */
export function snapshotInSync(st: EnvState) {
  if (st.kind !== "values" || !st.local || !st.stored || st.merge.toLocal.length || st.merge.toStore.length || st.merge.conflicts.length) return;
  writeSnapshot(st, st.merge.result);
}
