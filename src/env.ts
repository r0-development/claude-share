/** .env files (ADR-0003), the pure part: which files travel, how a project's files map to entries in the share's secrets
 *  area, and the per-key three-way merge behind "newest wins, asked only when both sides changed the same key".
 *  No I/O here — src/envfiles.ts observes and writes; tests/unit.test.ts covers every rule. */

/** tracked → git's business; values → travels with its values (encrypted in the share); local → keys only (site-specific
 *  values stay per machine); unignored → an untracked file git would commit: refused until it is gitignored. */
export type EnvKind = "tracked" | "values" | "local" | "unignored";
export const isEnvName = (name: string) => /^\.env(\..+)?$/.test(name);
export function classify(name: string, git: { tracked: boolean; ignored: boolean }, extraLocal: string[] = []): EnvKind {
  if (git.tracked) return "tracked";
  if (!git.ignored) return "unignored";
  return name.endsWith(".local") || extraLocal.includes(name) ? "local" : "values";
}

/** `.env` of project web is the entry `web` (what cs secrets set web already writes); `.env.production` is `web.production`. */
export const storeName = (project: string, file: string) => (file === ".env" ? project : `${project}.${file.slice(".env.".length)}`);
/** The inverse: the entry's file name for `project`, or undefined when the entry is not that project's. */
export function fileOf(project: string, entry: string): string | undefined {
  if (entry === project) return ".env";
  return entry.startsWith(project + ".") && entry.length > project.length + 1 ? ".env." + entry.slice(project.length + 1) : undefined;
}

export type Values = Record<string, string>;
export type Side = "local" | "stored";
/** The same key changed on both sides since the last sync; a side undefined = removed there. */
export interface KeyConflict { key: string; local: string | undefined; stored: string | undefined }
/** `result` is the merged file (conflicts left out until decided); `toLocal` / `toStore` are the keys each side must
 *  change (a key absent from `result` is a removal). */
export interface Merge { result: Values; toLocal: string[]; toStore: string[]; conflicts: KeyConflict[] }

/** Per key against the last-synced snapshot: changed on one side → taken; changed on both to the same value → fine;
 *  to different values (or removed on one side, changed on the other) → a conflict unless `decide` names the side.
 *  No snapshot (first sync of this file here): keys are united, a value that differs on both sides is a conflict. */
export function merge3(base: Values | undefined, local: Values, stored: Values, decide: Partial<Record<string, Side>> = {}): Merge {
  const result: Values = {}, toLocal: string[] = [], toStore: string[] = [], conflicts: KeyConflict[] = [];
  const keys = new Set([...Object.keys(base ?? {}), ...Object.keys(local), ...Object.keys(stored)]);
  const put = (k: string, v: string | undefined) => { if (v !== undefined) result[k] = v; if (v !== local[k]) toLocal.push(k); if (v !== stored[k]) toStore.push(k); };
  for (const k of keys) {
    const l = local[k], s = stored[k];
    if (l === s) { put(k, l); continue; }
    const localChanged = base ? l !== base[k] : l !== undefined, storedChanged = base ? s !== base[k] : s !== undefined;
    if (localChanged && storedChanged) { const side = decide[k]; if (side) put(k, side === "local" ? l : s); else conflicts.push({ key: k, local: l, stored: s }); continue; }
    put(k, localChanged ? l : s);
  }
  return { result, toLocal, toStore, conflicts };
}

const quote = (v: string) => (/[ #"'\\$`]/.test(v) || v === "" ? JSON.stringify(v) : v);
/** Rewrite a dotenv text to hold exactly `values`: lines of keys that keep their value stay byte for byte (comments, order,
 *  `export`, quoting style), changed keys get a fresh value on their line, removed keys lose their line, new keys are appended. */
export function patchDotenv(text: string, values: Values): string {
  const seen = new Set<string>(); const out: string[] = [];
  const lines = text.split("\n"); if (lines[lines.length - 1] === "") lines.pop();
  for (const line of lines) {
    const m = line.match(/^(\s*(?:export\s+)?)([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (!m || seen.has(m[2])) { out.push(line); continue; }
    const k = m[2]; seen.add(k);
    if (!(k in values)) continue;
    const cur = parseValue(m[3]);
    out.push(cur === values[k] ? line : `${m[1]}${k}=${quote(values[k])}`);
  }
  for (const [k, v] of Object.entries(values)) if (!seen.has(k)) out.push(`${k}=${quote(v)}`);
  return out.length ? out.join("\n") + "\n" : "";
}
function parseValue(raw: string): string {
  let v = raw.trim();
  if (v.length >= 2 && v[0] === '"' && v[v.length - 1] === '"') { try { return JSON.parse(v); } catch { return v.slice(1, -1); } }
  if (v.length >= 2 && v[0] === "'" && v[v.length - 1] === "'") return v.slice(1, -1);
  return v;
}

/** "store 2 keys, take 1 key from laptop, 1 key changed on both machines — asked next" — the plan-screen hint.
 *  A key leaving `result` is a removal and says so ("drop 1 key from the share" / "drop 1 key here"). */
export function describeMerge(m: Merge, from?: string): string {
  const n = (c: number) => `${c} key${c === 1 ? "" : "s"}`;
  const put = m.toStore.filter((k) => k in m.result).length, take = m.toLocal.filter((k) => k in m.result).length;
  return [put ? `store ${n(put)}` : "", m.toStore.length - put ? `drop ${n(m.toStore.length - put)} from the share` : "",
    take ? `take ${n(take)}${from ? ` from ${from}` : ""}` : "", m.toLocal.length - take ? `drop ${n(m.toLocal.length - take)} here` : "",
    m.conflicts.length ? `${n(m.conflicts.length)} changed on both machines — asked next` : ""].filter(Boolean).join(", ");
}
