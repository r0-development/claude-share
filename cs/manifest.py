"""The project manifest: <config-repo>/projects.toml."""
from __future__ import annotations

import fnmatch
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from . import SUPPORTED_SCHEMA, paths, toml
from .config import Machine

KINDS = ("git", "synced", "local")
LAYOUTS = ("plain", "worktrees")
NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")


@dataclass
class Identity:
    id: str
    name: str
    email: str
    ssh_key: str = "~/.ssh/id_ed25519"
    gh_user: str = ""
    url_globs: List[str] = field(default_factory=list)

    def matches(self, url: str) -> bool:
        return any(fnmatch.fnmatchcase(url, g) for g in self.url_globs)


@dataclass
class Project:
    name: str
    kind: str = "git"
    path: str = ""                       # relative to workspace root; defaults to name
    url: str = ""
    identity: str = ""
    profiles: List[str] = field(default_factory=lambda: ["all"])
    machines: List[str] = field(default_factory=list)
    branch: str = ""
    layout: str = "plain"
    post_clone: str = ""
    description: str = ""
    handoff: Dict[str, Any] = field(default_factory=dict)
    sync: Dict[str, Any] = field(default_factory=dict)

    def selected(self, m: Machine) -> bool:
        if self.machines and m.name not in self.machines:
            return False
        if self.name in m.exclude:
            return False
        return "all" in self.profiles or bool(set(self.profiles) & set(m.profiles))

    def checkout_root(self, workspace: Path) -> Path:
        """Where the git checkout (or plain dir) lives."""
        base = workspace / (self.path or self.name)
        return base / "repo" if self.layout == "worktrees" else base

    def container(self, workspace: Path) -> Path:
        return workspace / (self.path or self.name)


@dataclass
class Manifest:
    workspace_root: str
    identities: Dict[str, Identity]
    projects: Dict[str, Project]
    schema_version: int = 1
    path: Optional[Path] = None

    def workspace(self, m: Optional[Machine] = None) -> Path:
        if m and m.workspace:
            return paths.expand(m.workspace)
        return paths.expand(self.workspace_root)

    def selected(self, m: Machine) -> List[Project]:
        return [p for p in self.projects.values() if p.selected(m)]

    def identity_for_url(self, url: str) -> Optional[Identity]:
        for ident in self.identities.values():
            if ident.matches(url):
                return ident
        return None

    def project_for_path(self, p: Path, m: Optional[Machine] = None) -> Optional[Project]:
        """Map a filesystem path (cwd) to the project containing it."""
        ws = self.workspace(m)
        try:
            rel = p.resolve().relative_to(ws.resolve())
        except ValueError:
            return None
        parts = rel.parts
        if not parts:
            return None
        for proj in self.projects.values():
            if (proj.path or proj.name) == parts[0]:
                return proj
        return None

    def validate(self) -> List[str]:
        errs: List[str] = []
        if self.schema_version > SUPPORTED_SCHEMA:
            errs.append(f"projects.toml schema_version {self.schema_version} > supported {SUPPORTED_SCHEMA}; run `cs self-update`")
        for p in self.projects.values():
            if not NAME_RE.match(p.name):
                errs.append(f"{p.name}: invalid project name")
            if p.kind not in KINDS:
                errs.append(f"{p.name}: kind must be one of {KINDS}")
            if p.layout not in LAYOUTS:
                errs.append(f"{p.name}: layout must be one of {LAYOUTS}")
            if p.kind == "git":
                if not p.url:
                    errs.append(f"{p.name}: kind=git requires url")
                if not p.identity:
                    errs.append(f"{p.name}: kind=git requires identity")
                elif p.identity not in self.identities:
                    errs.append(f"{p.name}: unknown identity '{p.identity}'")
                elif p.url and not self.identities[p.identity].matches(p.url):
                    errs.append(f"{p.name}: url {p.url} does not match identity '{p.identity}' url_globs")
            if p.path and (Path(p.path).is_absolute() or ".." in Path(p.path).parts):
                errs.append(f"{p.name}: path must be relative and inside the workspace")
        return errs


def _project(name: str, d: Dict[str, Any]) -> Project:
    return Project(
        name=name,
        kind=d.get("kind", "git"),
        path=d.get("path", ""),
        url=d.get("url", ""),
        identity=d.get("identity", ""),
        profiles=list(d.get("profiles", ["all"])),
        machines=list(d.get("machines", [])),
        branch=d.get("branch", ""),
        layout=d.get("layout", "plain"),
        post_clone=d.get("post_clone", ""),
        description=d.get("description", ""),
        handoff=dict(d.get("handoff", {})),
        sync=dict(d.get("sync", {})),
    )


def parse(text: str, path: Optional[Path] = None) -> Manifest:
    d = toml.loads(text)
    idents = {
        k: Identity(
            id=k,
            name=v.get("name", ""),
            email=v.get("email", ""),
            ssh_key=v.get("ssh_key", "~/.ssh/id_ed25519"),
            gh_user=v.get("gh_user", ""),
            url_globs=list(v.get("url_globs", [])),
        )
        for k, v in d.get("identities", {}).items()
    }
    projects = {k: _project(k, v) for k, v in d.get("projects", {}).items()}
    return Manifest(
        workspace_root=d.get("workspace", {}).get("root", "~/dev"),
        identities=idents,
        projects=projects,
        schema_version=int(d.get("schema_version", 1)),
        path=path,
    )


def load(repo: Path) -> Manifest:
    f = repo / "projects.toml"
    if not f.exists():
        raise SystemExit(f"cs: no projects.toml in {paths.contract(repo)}")
    m = parse(f.read_text(), f)
    errs = m.validate()
    if errs:
        raise SystemExit("cs: projects.toml invalid:\n  " + "\n  ".join(errs))
    return m


def project_block(p: Project) -> str:
    """Render a `[projects.<name>]` block for appending to projects.toml."""
    values: Dict[str, Any] = {"kind": p.kind}
    if p.path and p.path != p.name:
        values["path"] = p.path
    if p.kind == "git":
        values["url"] = p.url
        values["identity"] = p.identity
        if p.branch:
            values["branch"] = p.branch
    values["profiles"] = p.profiles
    if p.machines:
        values["machines"] = p.machines
    if p.layout != "plain":
        values["layout"] = p.layout
    if p.post_clone:
        values["post_clone"] = p.post_clone
    if p.description:
        values["description"] = p.description
    return toml.table(f"projects.{p.name}", values)


def append_project(repo: Path, p: Project) -> None:
    f = repo / "projects.toml"
    text = f.read_text()
    if re.search(rf"^\[projects\.{re.escape(p.name)}\]\s*$", text, re.M):
        raise SystemExit(f"cs: project '{p.name}' already registered (edit projects.toml to change it)")
    if not text.endswith("\n"):
        text += "\n"
    f.write_text(text + "\n" + project_block(p))
