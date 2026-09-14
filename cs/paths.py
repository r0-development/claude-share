"""Every well-known path in one place. All derived from HOME / env so tests can
point cs at a throwaway home."""
from __future__ import annotations

import os
from pathlib import Path


def home() -> Path:
    return Path(os.environ.get("HOME") or Path.home())


def claude_dir() -> Path:
    return Path(os.environ.get("CLAUDE_CONFIG_DIR") or home() / ".claude")


def claude_json() -> Path:
    """The monolithic ~/.claude.json (machine-local; cs only reads it)."""
    cfg = os.environ.get("CLAUDE_CONFIG_DIR")
    return (Path(cfg) if cfg else home()) / ".claude.json"


def cs_config_dir() -> Path:
    return Path(os.environ.get("CS_CONFIG_DIR") or home() / ".config" / "claude-share")


def machine_file() -> Path:
    return cs_config_dir() / "machine.toml"


def repo_dir() -> Path:
    """The private config repo clone (overridable in machine.toml via `repo`)."""
    return cs_config_dir() / "repo"


def state_dir() -> Path:
    base = Path(os.environ.get("XDG_STATE_HOME") or home() / ".local" / "state")
    return base / "cs"


def tool_root() -> Path:
    return Path(__file__).resolve().parent.parent


def templates_dir() -> Path:
    return tool_root() / "templates"


def expand(p: str) -> Path:
    """Expand ~ and env vars against the (possibly overridden) HOME."""
    p = os.path.expandvars(p)
    if p == "~" or p.startswith("~/"):
        p = str(home()) + p[1:]
    return Path(p)


def contract(p: Path) -> str:
    """Inverse of expand(): render a path with ~ for the home prefix."""
    try:
        rel = p.relative_to(home())
    except ValueError:
        return str(p)
    return "~" if str(rel) == "." else "~/" + str(rel)
