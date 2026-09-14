"""`cs hooks install|remove|status`: automatic sync.

Claude Code hooks (written into the config repo's claude/settings.base.json, so every machine gets them):
  Stop (async)          -> cs sync --push-only --quiet --debounce 120
  SessionStart[startup] -> cs sync --pull-only --quiet --timeout 5
Timer (per machine): systemd --user (Linux/WSL2) or launchd (macOS) running `cs sync --quiet` every 15 min.
"""
from __future__ import annotations

import plistlib
import subprocess
from pathlib import Path
from typing import Dict, List

from . import gitutil, jsonmerge, paths, platform, ui
from .config import Machine

CS = "$HOME/.local/bin/cs"
STOP_CMD = f"command -v cs >/dev/null 2>&1 && cs sync --push-only --quiet --debounce 120 || true"
START_CMD = f"command -v cs >/dev/null 2>&1 && cs sync --pull-only --quiet --timeout 5 || true"
TAG = "claude-share"


def _hook_entries() -> Dict[str, List[dict]]:
    return {
        "Stop": [{"hooks": [{"type": "command", "command": STOP_CMD, "async": True, "timeout": 120}]}],
        "SessionStart": [{"matcher": "startup", "hooks": [{"type": "command", "command": START_CMD, "timeout": 15}]}],
    }


def _is_ours(entry: dict) -> bool:
    return any("cs sync" in h.get("command", "") for h in entry.get("hooks", []))


def install_hooks(repo: Path, m: Machine, remove: bool = False) -> bool:
    f = repo / "claude" / "settings.base.json"
    data = jsonmerge.loads(f.read_text()) if f.exists() else {}
    hooks = data.setdefault("hooks", {})
    changed = False
    for event, entries in _hook_entries().items():
        cur = [e for e in hooks.get(event, []) if not _is_ours(e)]
        new = cur if remove else cur + entries
        if new != hooks.get(event, []):
            hooks[event] = new
            changed = True
        if not hooks[event]:
            del hooks[event]
    if not hooks:
        data.pop("hooks", None)
    if changed:
        f.write_text(jsonmerge.dumps(data))
        gitutil.run(["add", str(f.relative_to(repo))], repo)
        gitutil.commit(repo, "claude: " + ("remove" if remove else "install") + " cs sync hooks", "cs", f"cs@{m.name}")
    return changed


def _systemd_dir() -> Path:
    return paths.home() / ".config" / "systemd" / "user"


def install_timer(remove: bool = False) -> str:
    if platform.is_macos():
        plist = paths.home() / "Library" / "LaunchAgents" / "dev.claude-share.sync.plist"
        label = "dev.claude-share.sync"
        if remove:
            subprocess.run(["launchctl", "unload", str(plist)], capture_output=True)
            plist.unlink(missing_ok=True)
            return "launchd agent removed"
        plist.parent.mkdir(parents=True, exist_ok=True)
        with open(plist, "wb") as fh:
            plistlib.dump({
                "Label": label,
                "ProgramArguments": ["/bin/sh", "-lc", "cs sync --quiet"],
                "StartInterval": 900,
                "RunAtLoad": False,
                "StandardOutPath": str(paths.state_dir() / "timer.log"),
                "StandardErrorPath": str(paths.state_dir() / "timer.log"),
            }, fh)
        subprocess.run(["launchctl", "unload", str(plist)], capture_output=True)
        p = subprocess.run(["launchctl", "load", str(plist)], capture_output=True, text=True)
        return "launchd agent every 15 min" + ("" if p.returncode == 0 else f" (load failed: {p.stderr.strip()})")
    d = _systemd_dir()
    svc, tmr = d / "cs-sync.service", d / "cs-sync.timer"
    if remove:
        subprocess.run(["systemctl", "--user", "disable", "--now", "cs-sync.timer"], capture_output=True)
        svc.unlink(missing_ok=True)
        tmr.unlink(missing_ok=True)
        return "systemd timer removed"
    d.mkdir(parents=True, exist_ok=True)
    svc.write_text("[Unit]\nDescription=claude-share sync\n\n[Service]\nType=oneshot\n"
                   f"ExecStart=/bin/sh -lc 'cs sync --quiet'\nStandardOutput=append:{paths.state_dir() / 'timer.log'}\n"
                   f"StandardError=append:{paths.state_dir() / 'timer.log'}\n")
    tmr.write_text("[Unit]\nDescription=claude-share sync every 15 min\n\n[Timer]\nOnBootSec=2min\nOnUnitActiveSec=15min\n"
                   "Persistent=true\n\n[Install]\nWantedBy=timers.target\n")
    paths.state_dir().mkdir(parents=True, exist_ok=True)
    p = subprocess.run(["systemctl", "--user", "daemon-reload"], capture_output=True, text=True)
    if p.returncode != 0:
        return f"systemd --user unavailable ({p.stderr.strip()}); timer files written, not enabled"
    p = subprocess.run(["systemctl", "--user", "enable", "--now", "cs-sync.timer"], capture_output=True, text=True)
    return "systemd user timer every 15 min" + ("" if p.returncode == 0 else f" (enable failed: {p.stderr.strip()})")


def run(repo: Path, m: Machine, action: str, timer: bool = True) -> int:
    if action == "status":
        f = repo / "claude" / "settings.base.json"
        data = jsonmerge.loads(f.read_text()) if f.exists() else {}
        have = [ev for ev, es in data.get("hooks", {}).items() if any(_is_ours(e) for e in es)]
        ui.kv("hooks", ", ".join(have) if have else ui.dim("not installed"))
        if platform.is_macos():
            ok = (paths.home() / "Library" / "LaunchAgents" / "dev.claude-share.sync.plist").exists()
        else:
            p = subprocess.run(["systemctl", "--user", "is-active", "cs-sync.timer"], capture_output=True, text=True)
            ok = p.stdout.strip() == "active"
        ui.kv("timer", ui.green("active") if ok else ui.dim("not active"))
        last = paths.state_dir() / "last-config"
        ui.kv("last sync", last.read_text().strip() if last.exists() else ui.dim("never"))
        return 0
    remove = action == "remove"
    if install_hooks(repo, m, remove):
        ui.ok(("removed" if remove else "installed") + " Claude Code hooks in claude/settings.base.json (run `cs apply`)")
    else:
        ui.info("  [skip] hooks already " + ("absent" if remove else "present"))
    if timer:
        ui.ok(install_timer(remove))
    return 0
