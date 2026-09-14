"""Per-machine, untracked configuration: ~/.config/claude-share/machine.toml."""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

from . import paths, toml


@dataclass
class Machine:
    name: str
    profiles: List[str] = field(default_factory=lambda: ["personal"])
    exclude: List[str] = field(default_factory=list)
    workspace: Optional[str] = None      # overrides projects.toml [workspace].root
    repo: Optional[str] = None           # overrides default config-repo location
    secrets_backend: str = "sops"        # sops | none

    @property
    def repo_dir(self) -> Path:
        return paths.expand(self.repo) if self.repo else paths.repo_dir()

    def to_toml(self) -> str:
        head = toml.table(
            "",
            {
                "name": self.name,
                "profiles": self.profiles,
                "exclude": self.exclude,
                "workspace": self.workspace,
                "repo": self.repo,
            },
            comment="claude-share machine config (not synced). Edit freely.",
        )
        return head + "\n" + toml.table("secrets", {"backend": self.secrets_backend})


def load() -> Machine:
    f = paths.machine_file()
    if not f.exists():
        raise SystemExit(f"cs: no machine config at {paths.contract(f)} — run `cs init` first")
    d = toml.load_file(f)
    return Machine(
        name=d["name"],
        profiles=list(d.get("profiles", ["personal"])),
        exclude=list(d.get("exclude", [])),
        workspace=d.get("workspace"),
        repo=d.get("repo"),
        secrets_backend=d.get("secrets", {}).get("backend", "sops"),
    )


def save(m: Machine) -> Path:
    f = paths.machine_file()
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(m.to_toml())
    return f


def exists() -> bool:
    return paths.machine_file().exists()
