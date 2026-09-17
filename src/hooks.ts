/** Hooks and the timer keep the share in sync unattended (ADR-0002: they touch only the share, never a project remote).
 *  Installed by cs init, re-installed by cs sync self-heal, reported by cs doctor; `cs hooks` is the hidden manual switch. */
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { exec } from "./proc.js";
import { home, stateDir } from "./paths.js";
import * as platform from "./platform.js";
import { commit, type Share } from "./share.js";
import { dumps, loads } from "./jsonmerge.js";
import { lastSync } from "./sharesync.js";
import * as ui from "./ui.js";

const STOP = "command -v cs >/dev/null 2>&1 && cs share-sync --push-only --quiet --debounce 120 || true";
const START = "command -v cs >/dev/null 2>&1 && { cs share-sync --pull-only --quiet --timeout 5; cs note --print 2>/dev/null; } || true";
const entries = (): Record<string, any[]> => ({
  Stop: [{ hooks: [{ type: "command", command: STOP, async: true, timeout: 120 }] }],
  SessionStart: [{ matcher: "startup", hooks: [{ type: "command", command: START, timeout: 15 }] }],
});
export const HOOK_EVENTS = Object.keys(entries());
/** Ours = any hook that runs cs (old `cs sync …` / SessionEnd `cs handoff --mark` hook commands included, so re-installing replaces or drops them). */
const ours = (e: any) => (e.hooks ?? []).some((h: any) => /\bcs (share-sync|sync|handoff|note)\b/.test(String(h.command ?? "")));
/** The settings with our hooks installed (or removed): every event keeps its other hooks, ours are replaced by the current
 *  commands, an event left empty goes, and so does an empty `hooks`; every other key stays where it was. Pure — the input is not touched. */
export function withCsHooks(settings: Record<string, unknown>, { remove = false } = {}): Record<string, unknown> {
  const before: Record<string, any[]> = (settings.hooks as any) ?? {}; const want = remove ? {} : entries(); const hooks: Record<string, any[]> = {};
  for (const ev of new Set([...Object.keys(before), ...Object.keys(want)])) { const next = [...(before[ev] ?? []).filter((e) => !ours(e)), ...(want[ev] ?? [])]; if (next.length) hooks[ev] = next; }
  const out: Record<string, unknown> = {}; const any = Object.keys(hooks).length > 0;
  for (const [k, v] of Object.entries(settings)) { if (k !== "hooks") out[k] = v; else if (any) out.hooks = hooks; }
  if (any && !("hooks" in settings)) out.hooks = hooks;
  return out;
}
const baseSettingsFile = (share: Share) => join(share.path, "claude", "settings.base.json");
const readBaseSettings = (share: Share): Record<string, unknown> => (existsSync(baseSettingsFile(share)) ? loads(readFileSync(baseSettingsFile(share), "utf8")) : {});
/** read → withCsHooks → write → commit; false when the share already had it that way. */
export function installHooks(share: Share, remove = false): boolean {
  const data = readBaseSettings(share); const next = withCsHooks(data, { remove });
  if (JSON.stringify(next) === JSON.stringify(data)) return false;
  writeFileSync(baseSettingsFile(share), dumps(next)); commit(share, `claude: ${remove ? "remove" : "install"} cs share-sync hooks`, [baseSettingsFile(share)]);
  return true;
}
/** Async: `systemctl`/`launchctl` run under a spinner in cs init and cs sync. */
export async function installTimer(remove = false): Promise<string> {
  mkdirSync(stateDir(), { recursive: true }); const log = join(stateDir(), "timer.log");
  if (platform.isMac()) {
    const plist = join(home(), "Library", "LaunchAgents", "dev.claude-share.sync.plist");
    if (remove) { await exec("launchctl", ["unload", plist]); if (existsSync(plist)) unlinkSync(plist); return "launchd agent removed"; }
    mkdirSync(join(home(), "Library", "LaunchAgents"), { recursive: true });
    writeFileSync(plist, `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>\n<key>Label</key><string>dev.claude-share.sync</string>\n<key>ProgramArguments</key><array><string>/bin/sh</string><string>-lc</string><string>cs share-sync --quiet</string></array>\n<key>StartInterval</key><integer>900</integer>\n<key>StandardOutPath</key><string>${log}</string>\n<key>StandardErrorPath</key><string>${log}</string>\n</dict></plist>\n`);
    await exec("launchctl", ["unload", plist]); const p = await exec("launchctl", ["load", plist]);
    return "launchd agent every 15 min" + (p.code === 0 ? "" : ` (load failed: ${p.err})`);
  }
  const d = join(home(), ".config", "systemd", "user"); const svc = join(d, "cs-sync.service"), tmr = join(d, "cs-sync.timer");
  if (remove) { await exec("systemctl", ["--user", "disable", "--now", "cs-sync.timer"]); for (const f of [svc, tmr]) if (existsSync(f)) unlinkSync(f); return "systemd timer removed"; }
  mkdirSync(d, { recursive: true });
  writeFileSync(svc, `[Unit]\nDescription=claude-share sync\n\n[Service]\nType=oneshot\nExecStart=/bin/sh -lc 'cs share-sync --quiet'\nStandardOutput=append:${log}\nStandardError=append:${log}\n`);
  writeFileSync(tmr, "[Unit]\nDescription=claude-share sync every 15 min\n\n[Timer]\nOnBootSec=2min\nOnUnitActiveSec=15min\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n");
  const r = await exec("systemctl", ["--user", "daemon-reload"]); if (r.code !== 0) return `systemd --user unavailable (${r.err}); timer files written, not enabled`;
  const e = await exec("systemctl", ["--user", "enable", "--now", "cs-sync.timer"]); return "systemd user timer every 15 min" + (e.code === 0 ? "" : ` (enable failed: ${e.err})`);
}
/** Are the hooks in the share (every event, with the current commands, and no cs hook on any other event); is the timer active (and can it be on this host). */
export function hooksStatus(share: Share): { events: string[]; complete: boolean; timerActive: boolean; timerFiles: boolean; timerSupported: boolean } {
  const data = readBaseSettings(share); const hooks = (data.hooks as Record<string, any[]>) ?? {};
  const csHooks = (h: Record<string, any[]>) => Object.entries(h).map(([ev, es]): [string, any[]] => [ev, es.filter(ours)]).filter(([, es]) => es.length).sort(([a], [b]) => a.localeCompare(b));
  const events = Object.keys(hooks).filter((ev) => hooks[ev].some(ours)); const complete = JSON.stringify(csHooks(hooks)) === JSON.stringify(csHooks(entries()));
  const timerFiles = platform.isMac() ? existsSync(join(home(), "Library", "LaunchAgents", "dev.claude-share.sync.plist")) : existsSync(join(home(), ".config", "systemd", "user", "cs-sync.timer"));
  const state = platform.isMac() ? "" : spawnSync("systemctl", ["--user", "is-active", "cs-sync.timer"], { encoding: "utf8" }).stdout?.trim() ?? "";   // instant local query; "" = no user manager to talk to
  const timerActive = platform.isMac() ? timerFiles : state === "active"; const timerSupported = platform.isMac() || state !== "";
  return { events, complete, timerActive, timerFiles, timerSupported };
}
export async function runHooks(share: Share, action: string, timer = true): Promise<number> {
  if (action === "status") {
    const st = hooksStatus(share);
    ui.kv("hooks", st.events.length ? st.events.join(", ") + (st.complete ? "" : ui.yellow("  (outdated — cs hooks install)")) : ui.dim("not installed"));
    ui.kv("timer", st.timerActive ? ui.green("active") : ui.dim("not active"));
    ui.kv("last sync", lastSync() ?? ui.dim("never")); return 0;
  }
  const remove = action === "remove";
  installHooks(share, remove) ? ui.ok(`${remove ? "removed" : "installed"} Claude Code hooks in claude/settings.base.json (run cs apply)`) : ui.skip(`hooks already ${remove ? "absent" : "present"}`);
  if (timer) ui.ok(await installTimer(remove));
  return 0;
}
