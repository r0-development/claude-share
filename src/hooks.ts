/** Hooks and the timer keep the share in sync unattended (ADR-0002: they touch only the share, never a project remote).
 *  Installed by cs init, re-installed by cs sync self-heal, reported by cs doctor; `cs hooks` is the hidden manual switch. */
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import * as git from "./git.js";
import { home, stateDir } from "./paths.js";
import * as platform from "./platform.js";
import type { Machine } from "./machine.js";
import { dumps, loads } from "./jsonmerge.js";
import * as ui from "./ui.js";

const STOP = "command -v cs >/dev/null 2>&1 && cs share-sync --push-only --quiet --debounce 120 || true";
const START = "command -v cs >/dev/null 2>&1 && { cs share-sync --pull-only --quiet --timeout 5; cs note --print 2>/dev/null; } || true";
const END = "command -v cs >/dev/null 2>&1 && cs handoff --mark --quiet || true";
const entries = (): Record<string, any[]> => ({
  Stop: [{ hooks: [{ type: "command", command: STOP, async: true, timeout: 120 }] }],
  SessionStart: [{ matcher: "startup", hooks: [{ type: "command", command: START, timeout: 15 }] }],
  SessionEnd: [{ hooks: [{ type: "command", command: END, timeout: 5 }] }],
});
/** Ours = any hook that runs cs (old `cs sync …` hook commands included, so re-installing replaces them). */
const ours = (e: any) => (e.hooks ?? []).some((h: any) => /\bcs (share-sync|sync|handoff|note)\b/.test(String(h.command ?? "")));
export function installHooks(repo: string, m: Machine, remove = false): boolean {
  const f = join(repo, "claude", "settings.base.json"); const data: any = existsSync(f) ? loads(readFileSync(f, "utf8")) : {};
  data.hooks ??= {}; let changed = false;
  for (const [ev, es] of Object.entries(entries())) { const cur = (data.hooks[ev] ?? []).filter((e: any) => !ours(e)); const next = remove ? cur : [...cur, ...es];
    if (JSON.stringify(next) !== JSON.stringify(data.hooks[ev] ?? [])) { data.hooks[ev] = next; changed = true; } if (!data.hooks[ev]?.length) delete data.hooks[ev]; }
  if (!Object.keys(data.hooks).length) delete data.hooks;
  if (changed) { writeFileSync(f, dumps(data)); git.git(["add", f], repo); git.commit(repo, `claude: ${remove ? "remove" : "install"} cs share-sync hooks`, "cs", `cs@${m.name}`); }
  return changed;
}
export function installTimer(remove = false): string {
  mkdirSync(stateDir(), { recursive: true }); const log = join(stateDir(), "timer.log");
  if (platform.isMac()) {
    const plist = join(home(), "Library", "LaunchAgents", "dev.claude-share.sync.plist");
    if (remove) { spawnSync("launchctl", ["unload", plist]); if (existsSync(plist)) unlinkSync(plist); return "launchd agent removed"; }
    mkdirSync(join(home(), "Library", "LaunchAgents"), { recursive: true });
    writeFileSync(plist, `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>\n<key>Label</key><string>dev.claude-share.sync</string>\n<key>ProgramArguments</key><array><string>/bin/sh</string><string>-lc</string><string>cs share-sync --quiet</string></array>\n<key>StartInterval</key><integer>900</integer>\n<key>StandardOutPath</key><string>${log}</string>\n<key>StandardErrorPath</key><string>${log}</string>\n</dict></plist>\n`);
    spawnSync("launchctl", ["unload", plist]); const p = spawnSync("launchctl", ["load", plist], { encoding: "utf8" });
    return "launchd agent every 15 min" + (p.status === 0 ? "" : ` (load failed: ${p.stderr?.trim()})`);
  }
  const d = join(home(), ".config", "systemd", "user"); const svc = join(d, "cs-sync.service"), tmr = join(d, "cs-sync.timer");
  if (remove) { spawnSync("systemctl", ["--user", "disable", "--now", "cs-sync.timer"]); for (const f of [svc, tmr]) if (existsSync(f)) unlinkSync(f); return "systemd timer removed"; }
  mkdirSync(d, { recursive: true });
  writeFileSync(svc, `[Unit]\nDescription=claude-share sync\n\n[Service]\nType=oneshot\nExecStart=/bin/sh -lc 'cs share-sync --quiet'\nStandardOutput=append:${log}\nStandardError=append:${log}\n`);
  writeFileSync(tmr, "[Unit]\nDescription=claude-share sync every 15 min\n\n[Timer]\nOnBootSec=2min\nOnUnitActiveSec=15min\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n");
  const r = spawnSync("systemctl", ["--user", "daemon-reload"], { encoding: "utf8" }); if (r.status !== 0) return `systemd --user unavailable (${r.stderr?.trim()}); timer files written, not enabled`;
  const e = spawnSync("systemctl", ["--user", "enable", "--now", "cs-sync.timer"], { encoding: "utf8" }); return "systemd user timer every 15 min" + (e.status === 0 ? "" : ` (enable failed: ${e.stderr?.trim()})`);
}
/** Are the hooks in the share (all three events, with the current commands), is the timer active, when did the share last sync. */
export function hooksStatus(repo: string): { events: string[]; complete: boolean; timerActive: boolean; timerFiles: boolean; lastSync?: string } {
  const f = join(repo, "claude", "settings.base.json"); const data: any = existsSync(f) ? loads(readFileSync(f, "utf8")) : {};
  const want = entries(); const events = Object.keys(want).filter((ev) => (data.hooks?.[ev] ?? []).some(ours));
  const complete = Object.entries(want).every(([ev, es]) => JSON.stringify((data.hooks?.[ev] ?? []).filter(ours)) === JSON.stringify(es));
  const timerFiles = platform.isMac() ? existsSync(join(home(), "Library", "LaunchAgents", "dev.claude-share.sync.plist")) : existsSync(join(home(), ".config", "systemd", "user", "cs-sync.timer"));
  const timerActive = platform.isMac() ? timerFiles : spawnSync("systemctl", ["--user", "is-active", "cs-sync.timer"], { encoding: "utf8" }).stdout?.trim() === "active";
  const last = join(stateDir(), "last-config"); const lastSync = existsSync(last) ? readFileSync(last, "utf8").trim() : undefined;
  return { events, complete, timerActive, timerFiles, lastSync };
}
export function runHooks(repo: string, m: Machine, action: string, timer = true): number {
  if (action === "status") {
    const st = hooksStatus(repo);
    ui.kv("hooks", st.events.length ? st.events.join(", ") + (st.complete ? "" : ui.yellow("  (outdated — cs hooks install)")) : ui.dim("not installed"));
    ui.kv("timer", st.timerActive ? ui.green("active") : ui.dim("not active"));
    ui.kv("last sync", st.lastSync ?? ui.dim("never")); return 0;
  }
  const remove = action === "remove";
  installHooks(repo, m, remove) ? ui.ok(`${remove ? "removed" : "installed"} Claude Code hooks in claude/settings.base.json (run cs apply)`) : ui.skip(`hooks already ${remove ? "absent" : "present"}`);
  if (timer) ui.ok(installTimer(remove));
  return 0;
}
