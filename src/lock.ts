/** One run touching the share at a time: cs sync and the hooks' and timer's cs share-sync all take
 *  <state>/sync.lock, holding this process's pid. Re-entrant for the holder (cs sync's own share steps); a lock left by
 *  a process that is gone is taken over. */
import { closeSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { stateDir } from "./paths.js";

const lockFile = () => join(stateDir(), "sync.lock");
const holder = () => { try { return parseInt(readFileSync(lockFile(), "utf8"), 10); } catch { return NaN; } };
const alive = (pid: number) => { try { process.kill(pid, 0); return true; } catch { return false; } };

/** The release function when the lock is ours (a no-op when this process already held it), undefined when another live run has it. */
export function acquire(): (() => void) | undefined {
  mkdirSync(stateDir(), { recursive: true });
  const take = () => { const fd = openSync(lockFile(), "wx"); writeFileSync(fd, String(process.pid)); closeSync(fd); };
  try { take(); } catch {
    const pid = holder();
    if (pid === process.pid) return () => {};
    if (pid && alive(pid)) return undefined;
    try { unlinkSync(lockFile()); take(); } catch { return undefined; }   // a crashed run left it behind
  }
  return () => { try { if (holder() === process.pid) unlinkSync(lockFile()); } catch {} };
}
