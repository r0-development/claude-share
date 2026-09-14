"""Secrets backends. A backend turns names ("global", "projects/<name>") into
dotenv dicts and back. Chosen by machine.toml [secrets].backend = sops | none."""
from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional, Protocol

from ..config import Machine


class Backend(Protocol):
    name: str
    def init(self, repo: Path, m: Machine, interactive: bool) -> None: ...
    def ready(self, repo: Path) -> bool: ...
    def load_env(self, repo: Path, name: str) -> Dict[str, str]: ...
    def write_env(self, repo: Path, name: str, values: Dict[str, str]) -> Path: ...
    def edit(self, repo: Path, name: str) -> None: ...
    def status(self, repo: Path, m: Machine) -> None: ...


def get(m: Machine) -> Backend:
    if m.secrets_backend == "sops":
        from .sops import SopsBackend
        return SopsBackend()
    if m.secrets_backend == "none":
        from .none import NoneBackend
        return NoneBackend()
    raise SystemExit(f"cs: unknown secrets backend '{m.secrets_backend}' (sops | none)")


def env_file(repo: Path, name: str) -> Path:
    """'global' -> secrets/global.env ; '<project>' -> secrets/projects/<project>.env"""
    if name == "global":
        return repo / "secrets" / "global.env"
    return repo / "secrets" / "projects" / f"{name}.env"


def parse_dotenv(text: str) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        k = k.strip()
        if k.startswith("export "):
            k = k[7:].strip()
        v = v.strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        out[k] = v
    return out


def dump_dotenv(values: Dict[str, str]) -> str:
    lines = []
    for k, v in values.items():
        needs_quote = any(c in v for c in " #\"'\\$`") or v == ""
        lines.append(f"{k}={json_quote(v) if needs_quote else v}")
    return "\n".join(lines) + ("\n" if lines else "")


def json_quote(v: str) -> str:
    return '"' + v.replace("\\", "\\\\").replace('"', '\\"') + '"'
