/** Async subprocess helper — anything under a spinner must use this, never spawnSync (which freezes the event loop). */
import { spawn } from "node:child_process";

export interface ProcRes { code: number; out: string; err: string }
export function exec(cmd: string, args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv; timeout?: number; input?: string } = {}): Promise<ProcRes> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: opts.cwd, env: opts.env ?? process.env, stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "", done = false;
    const timer = opts.timeout ? setTimeout(() => { if (!done) { p.kill("SIGKILL"); err += "\ntimed out"; } }, opts.timeout * 1000) : undefined;
    p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) => { done = true; if (timer) clearTimeout(timer); resolve({ code: 127, out, err: err + e.message }); });
    p.on("close", (code) => { done = true; if (timer) clearTimeout(timer); resolve({ code: code ?? 1, out: out.trim(), err: err.trim() }); });
    if (opts.input !== undefined) p.stdin.write(opts.input); p.stdin.end();
  });
}
export const shell = (cmd: string, opts: { cwd?: string; env?: NodeJS.ProcessEnv; timeout?: number } = {}) => exec("bash", ["-lc", cmd], opts);
