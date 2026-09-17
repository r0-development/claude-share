/** Console UI on top of @clack/prompts. Scripted answers via CS_ANSWERS (JSON array) for tests;
 *  plain fallbacks when there is no TTY. Every symbol is accompanied by a word (grep-able). */
import * as p from "@clack/prompts";
import pc from "picocolors";
import { createInterface } from "node:readline";

let quiet = false;
let collecting: string[] | null = null;
export const setQuiet = (q: boolean) => { quiet = q; };
const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
export const isQuiet = () => quiet;
export const isTTY = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

const scripted: string[] | null = process.env.CS_ANSWERS ? JSON.parse(process.env.CS_ANSWERS) : null;
function nextAnswer(): string | undefined { return scripted && scripted.length ? scripted.shift() : undefined; }
export const isScripted = () => scripted !== null;
/** A prompt can be answered: a terminal, or scripted answers still queued. Otherwise callers take defaults. */
export const canAsk = () => isTTY() || Boolean(scripted && scripted.length);

export const c = pc;
export const dim = pc.dim, bold = pc.bold, green = pc.green, yellow = pc.yellow, red = pc.red, cyan = pc.cyan, gray = pc.gray, magenta = pc.magenta;

// ---------------------------------------------------------------- messages
export function info(msg = "") { if (quiet) return; if (collecting) { if (msg) collecting.push(msg); return; } p.log.message(msg); }
export function ok(msg: string) { if (quiet) return; if (collecting) { collecting.push(msg); return; } p.log.success(msg); }
export function step(msg: string) { if (quiet) return; if (collecting) { collecting.push(msg); return; } p.log.step(msg); }
/** The change lines a silent module returned, one step each. */
export function steps(lines: string[]) { for (const l of lines) step(l); }
export function skip(msg: string) { if (quiet || collecting) return; p.log.message(pc.dim("○ " + msg)); }

let activeSpinner: { message: (s: string) => void } | null = null;
const width = () => Math.max(40, (process.stdout.columns || 100) - 6);
const clip = (s: string, w = width()) => (strip(s).length > w ? s.slice(0, w - 1) + "…" : s);

/** One phase = spinner with the title while it runs, then the title and one ✓ line per collected step. */
export async function group<T>(title: string, fn: () => Promise<T> | T, opts: { done?: string; max?: number } = {}): Promise<T> {
  const prev = collecting; const mine: string[] = []; collecting = mine;
  const useSpin = !quiet && process.stdout.isTTY && !activeSpinner;
  const sp = useSpin ? p.spinner() : null;
  if (sp) { sp.start(title); activeSpinner = sp; }
  let result: T;
  try { result = await fn(); }
  catch (e) { if (sp) { sp.error(title); activeSpinner = null; } collecting = prev; throw e; }
  finally { collecting = prev; }
  if (sp) { sp.clear(); activeSpinner = null; }
  if (quiet) return result!;
  const items = mine.map((m) => m.trim()).filter(Boolean);
  const max = opts.max ?? 12;
  const lines = items.length ? items.slice(0, max).map((i) => `${pc.green("✓")} ${clip(i)}`) : [pc.dim(opts.done ?? "up to date")];
  if (items.length > max) lines.push(pc.dim(`… ${items.length - max} more`));
  p.log.success(pc.bold(title) + "\n" + lines.join("\n"));
  return result!;
}
export function warn(msg: string) { p.log.warn(msg); }
export function fail(msg: string) { p.log.error(msg); }
export function error(what: string, why = "", fix = "") {
  const lines = [pc.bold(what)];
  if (why) lines.push(why);
  if (fix) lines.push(pc.cyan("→ ") + fix);
  p.log.error(lines.join("\n"));
}
export function section(title: string) { if (!quiet) p.log.step(pc.bold(title)); }
export function intro(title: string) { if (!quiet) p.intro(pc.bold(title)); }
export function outro(msg: string) { if (!quiet) p.outro(msg); }
export function note(lines: string[], title?: string) { if (!quiet) p.note(lines.join("\n"), title); }
export function kv(key: string, value: string, width = 14) { info(`${pc.dim(key.padEnd(width))} ${value}`); }

export function table(rows: string[][], header?: string[]) {
  if (quiet || !rows.length) return;
  if (collecting) { for (const r of rows) collecting.push(r.join("  ")); return; }
  const all = header ? [header, ...rows] : rows;
  const ncol = Math.max(...all.map((r) => r.length));
  const vis = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "").length;
  const w = Array.from({ length: ncol }, (_, i) => Math.max(...all.map((r) => vis(r[i] ?? ""))));
  const fmt = (r: string[]) => r.map((cell, i) => cell + " ".repeat(w[i] - vis(cell))).join("  ").trimEnd();
  const lines = [...(header ? [pc.dim(fmt(header))] : []), ...rows.map(fmt)];
  p.log.message(lines.join("\n"));
}

// ---------------------------------------------------------------- prompts
function cancelled(v: unknown): never { p.cancel("cancelled"); process.exit(130); }

async function plainLine(q: string): Promise<string> {
  if (scripted) throw new Error(`cs: scripted answers exhausted at prompt '${q.trim()}'`);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => { let done = false; rl.on("close", () => { if (!done) { done = true; res(""); } }); rl.question(q, (a) => { done = true; rl.close(); res(a.trim()); }); });
}

export async function text(message: string, opts: { default?: string; placeholder?: string; validate?: (v: string) => string | undefined } = {}): Promise<string> {
  const a = nextAnswer();
  if (a !== undefined) {
    const v = a === "<default>" ? (opts.default ?? "") : a;
    const err = opts.validate?.(v);
    if (err) throw new Error(`scripted answer '${v}' rejected for '${message}': ${err}`);
    return v;
  }
  if (!isTTY()) {
    for (;;) {
      const v = (await plainLine(`? ${message}${opts.default ? ` [${opts.default}]` : ""}: `)) || (opts.default ?? "");
      const err = opts.validate?.(v);
      if (!err) return v;
      console.log("  ! " + err);
    }
  }
  const v = await p.text({ message, placeholder: opts.placeholder, defaultValue: opts.default, initialValue: undefined,
    validate: (x) => { const val = (x ?? "").trim() || (opts.default ?? ""); return opts.validate?.(val); } });
  if (p.isCancel(v)) cancelled(v);
  return (String(v ?? "").trim()) || (opts.default ?? "");
}

export async function password(message: string): Promise<string> {
  const a = nextAnswer();
  if (a !== undefined) return a;
  if (!isTTY()) return plainLine(`? ${message}: `);
  const v = await p.password({ message });
  if (p.isCancel(v)) cancelled(v);
  return String(v ?? "");
}

export async function confirm(message: string, initial = false): Promise<boolean> {
  const a = nextAnswer();
  if (a !== undefined) return a === "<default>" ? initial : a === "y" || a === "yes";
  if (!isTTY()) { const v = (await plainLine(`? ${message} [${initial ? "Y/n" : "y/N"}]: `)).toLowerCase(); return v ? v.startsWith("y") : initial; }
  const v = await p.confirm({ message, initialValue: initial });
  if (p.isCancel(v)) cancelled(v);
  return Boolean(v);
}

export async function select<T extends string>(message: string, options: { value: T; label: string; hint?: string }[], initial?: T): Promise<T> {
  const a = nextAnswer();
  if (a !== undefined) {
    if (a === "<default>") return initial ?? options[0].value;
    const hit = options.find((o) => o.value === a || o.label.toLowerCase().startsWith(a.toLowerCase()));
    if (!hit) throw new Error(`scripted answer '${a}' matches no option for '${message}'`);
    return hit.value;
  }
  if (!isTTY()) {
    console.log(`? ${message}`);
    options.forEach((o, i) => console.log(`  ${i + 1}) ${o.label}`));
    const v = await plainLine(`  choose [${(options.findIndex((o) => o.value === initial) + 1) || 1}]: `);
    const i = parseInt(v, 10);
    return i >= 1 && i <= options.length ? options[i - 1].value : (initial ?? options[0].value);
  }
  const v = await p.select({ message, options: options as any, initialValue: initial });
  if (p.isCancel(v)) cancelled(v);
  return v as T;
}

export async function multiselect<T extends string>(message: string, options: { value: T; label: string; hint?: string }[], initial: T[] = []): Promise<T[]> {
  const a = nextAnswer();
  if (a !== undefined) return a === "<default>" ? initial : (a.split(",").map((x) => x.trim()).filter(Boolean) as T[]);
  if (!isTTY()) {
    const v = await plainLine(`? ${message} (comma list of: ${options.map((o) => o.value).join(", ")}) [${initial.join(",")}]: `);
    return v ? (v.split(",").map((x) => x.trim()) as T[]) : initial;
  }
  const v = await p.multiselect({ message, options: options as any, initialValues: initial, required: false });
  if (p.isCancel(v)) cancelled(v);
  return v as T[];
}

export async function groupMultiselect<T extends string>(message: string, groups: Record<string, { value: T; label: string; hint?: string }[]>, initial: T[] = []): Promise<T[]> {
  const all = Object.values(groups).flat();
  const a = nextAnswer();
  if (a !== undefined) return a === "<default>" ? initial : a === "all" ? all.map((o) => o.value) : (a.split(",").map((x) => x.trim()).filter(Boolean) as T[]);
  if (!isTTY()) {
    console.log(`? ${message}`); for (const [g, opts] of Object.entries(groups)) console.log(`  ${g}: ${opts.map((o) => o.value).join(", ")}`);
    const v = await plainLine(`  comma list (Enter = ${initial.length === all.length ? "all" : initial.join(",")}): `);
    return v ? (v.split(",").map((x) => x.trim()) as T[]) : initial;
  }
  const v = await p.groupMultiselect({ message, options: groups as any, initialValues: initial, required: false, selectableGroups: true });
  if (p.isCancel(v)) cancelled(v);
  return v as T[];
}

/** "Done — check again" / "Skip": returns true to continue checking, false to skip. */
export async function proceed(message: string, doneLabel = "Done — check again", skipLabel = "Skip for now"): Promise<boolean> {
  return (await select(message, [{ value: "done", label: doneLabel }, { value: "skip", label: skipLabel }])) === "done";
}

export async function spin<T>(label: string, fn: (update: (l: string) => void) => Promise<T>): Promise<T> {
  if (activeSpinner) { const outer = activeSpinner; outer.message(label); return fn((l) => outer.message(l)); }
  if (quiet || !process.stdout.isTTY) return fn(() => {});
  const s = p.spinner();
  s.start(label); activeSpinner = s;
  try { const r = await fn((l) => s.message(l)); s.stop(label); return r; }
  catch (e) { s.error(label + " failed"); throw e; }
  finally { activeSpinner = null; }
}
/** intro → fn → outro. `fn` returns the outro message (or nothing for the default). */
export async function command<T>(title: string, fn: () => Promise<T> | T, opts: { outro?: (r: T) => string } = {}): Promise<T> {
  intro(title);
  try { const r = await fn(); outro(opts.outro ? opts.outro(r) : pc.dim("done")); return r; }
  catch (e: any) { const msg: string = e?.message ?? String(e); const [what, ...rest] = (msg.startsWith("cs: ") ? msg.slice(4) : msg).split("\n"); error(what, rest.join("\n").trim()); p.outro(pc.red("failed")); throw Object.assign(new Error("__handled__"), { handled: true, code: 1 }); }
}

/** Sequential sub-steps under one title (clack tasks). Each task returns its ✓ line. */
export async function tasks(items: { title: string; task: (message: (m: string) => void) => Promise<string> }[]) {
  if (quiet || !process.stdout.isTTY) { for (const t of items) { const r = await t.task(() => {}); step(r); } return; }
  await p.tasks(items);
}
