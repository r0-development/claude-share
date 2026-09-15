/** Console UI on top of @clack/prompts. Scripted answers via CS_ANSWERS (JSON array) for tests;
 *  plain fallbacks when there is no TTY. Every symbol is accompanied by a word (grep-able). */
import * as p from "@clack/prompts";
import pc from "picocolors";
import { createInterface } from "node:readline";

let quiet = false;
export const setQuiet = (q: boolean) => { quiet = q; };
export const isQuiet = () => quiet;
export const isTTY = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

const scripted: string[] | null = process.env.CS_ANSWERS ? JSON.parse(process.env.CS_ANSWERS) : null;
function nextAnswer(): string | undefined { return scripted && scripted.length ? scripted.shift() : undefined; }
export const isScripted = () => scripted !== null;

export const c = pc;
export const dim = pc.dim, bold = pc.bold, green = pc.green, yellow = pc.yellow, red = pc.red, cyan = pc.cyan, gray = pc.gray, magenta = pc.magenta;

// ---------------------------------------------------------------- messages
export function info(msg = "") { if (!quiet) p.log.message(msg); }
export function ok(msg: string) { if (!quiet) p.log.success(msg); }
export function step(msg: string) { if (!quiet) p.log.step(msg); }
export function skip(msg: string) { if (!quiet) p.log.message(pc.dim("○ " + msg)); }
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
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a.trim()); }));
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

/** Pause until Enter; returns "" or the skip key. */
export async function waitEnter(message: string, skipKey = ""): Promise<string> {
  const a = nextAnswer();
  if (a !== undefined) return a === "<default>" ? "" : a;
  const v = await text(message + (skipKey ? pc.dim(`  (${skipKey} to skip)`) : ""), { placeholder: "press Enter" });
  return v.trim();
}

export async function spin<T>(label: string, fn: (update: (l: string) => void) => Promise<T>): Promise<T> {
  if (quiet || !process.stdout.isTTY) return fn(() => {});
  const s = p.spinner();
  s.start(label);
  try { const r = await fn((l) => s.message(l)); s.stop(label); return r; }
  catch (e) { s.stop(pc.red(label + " failed")); throw e; }
}
