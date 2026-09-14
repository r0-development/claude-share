"""OS detection and the few platform-specific facts cs needs."""
from __future__ import annotations

import os
import platform as _platform
import sys
from pathlib import Path


def is_macos() -> bool:
    return sys.platform == "darwin"


def is_linux() -> bool:
    return sys.platform.startswith("linux")


def is_wsl() -> bool:
    if not is_linux():
        return False
    try:
        return "microsoft" in Path("/proc/version").read_text().lower()
    except OSError:
        return False


def refuse_unsupported() -> None:
    """Windows-native shells are out of scope; point at WSL."""
    if os.environ.get("MSYSTEM") or sys.platform in ("win32", "cygwin", "msys"):
        raise SystemExit(
            "cs: Windows-native shells are unsupported. Run inside WSL2 "
            "(`wsl --install -d Ubuntu-24.04`). See docs/WINDOWS.md."
        )


def shell_rc() -> Path:
    from .paths import home
    if is_macos():
        return home() / ".zshrc"
    return home() / ".bashrc"


def describe() -> str:
    if is_wsl():
        return "wsl2"
    if is_macos():
        return "macos"
    return _platform.system().lower()
