/** Async subprocess helper — anything under a spinner must use this, never spawnSync (which freezes the event loop). */
import { spawn } from "node:child_process";

export interface ProcRes { code: number; out: string; err: string }
/** `timeout` (seconds) returns at once with code 124 and "timed out" in `err`. `group` runs the command in its own process
 *  group so the cap kills what it spawned too (a script's `sleep`, a helper holding the pipes) — not for git: setsid
 *  drops the controlling terminal, and ssh could no longer ask for a passphrase or a host key. */
export function exec(cmd: string, args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv; timeout?: number; input?: string; group?: boolean } = {}): Promise<ProcRes> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: opts.cwd, env: opts.env ?? process.env, stdio: ["pipe", "pipe", "pipe"], detached: !!opts.group });
    let out = "", err = "", done = false;
    const finish = (r: ProcRes) => { if (done) return; done = true; if (timer) clearTimeout(timer); resolve(r); };
    const timer = opts.timeout ? setTimeout(() => {
      if (opts.group) { try { process.kill(-p.pid!, "SIGKILL"); } catch {} } else p.kill("SIGKILL");
      p.stdout.destroy(); p.stderr.destroy();   // an orphan may still hold the pipes — never wait for it
      finish({ code: 124, out: out.trim(), err: (err + "\ntimed out").trim() });
    }, opts.timeout * 1000) : undefined;
    p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) => finish({ code: 127, out, err: err + e.message }));
    p.on("close", (code) => finish({ code: code ?? 1, out: out.trim(), err: err.trim() }));
    p.stdin.on("error", () => {});   // the command may exit before reading its input
    if (opts.input !== undefined) p.stdin.write(opts.input); p.stdin.end();
  });
}
export const shell = (cmd: string, opts: { cwd?: string; env?: NodeJS.ProcessEnv; timeout?: number } = {}) => exec("bash", ["-lc", cmd], opts);
