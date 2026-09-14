from __future__ import annotations

from pathlib import Path
from typing import Dict

from .. import ui
from ..config import Machine


class NoneBackend:
    name = "none"

    def init(self, repo: Path, m: Machine, interactive: bool) -> None:
        ui.info("  secrets backend is 'none' — set [secrets].backend = \"sops\" in machine.toml to enable")

    def ready(self, repo: Path) -> bool:
        return True

    def load_env(self, repo: Path, name: str) -> Dict[str, str]:
        return {}

    def write_env(self, repo: Path, name: str, values: Dict[str, str]) -> Path:
        raise SystemExit("cs: secrets backend 'none' cannot store secrets")

    def edit(self, repo: Path, name: str) -> None:
        raise SystemExit("cs: secrets backend 'none' cannot store secrets")

    def status(self, repo: Path, m: Machine) -> None:
        ui.info("  backend none")
