"""`cs status`: one screen — config repo, every selected project, unregistered dirs."""
from __future__ import annotations

from pathlib import Path
from typing import List

from . import gitutil, link, paths
from .config import Machine
from .manifest import Manifest
from .ui import head, info, warn


def _repo_line(path: Path, fetch: bool) -> str:
    if not gitutil.is_repo(path):
        return "not a git repo"
    if fetch:
        gitutil.run(["fetch", "-q", "--prune"], path, check=False, timeout=15)
    branch = gitutil.current_branch(path) or "DETACHED"
    dirty = gitutil.dirty_count(path)
    ab = gitutil.ahead_behind(path)
    parts = [branch]
    if dirty:
        parts.append(f"{dirty} dirty")
    if ab:
        if ab[0]:
            parts.append(f"↑{ab[0]}")
        if ab[1]:
            parts.append(f"↓{ab[1]}")
    elif branch != "DETACHED":
        parts.append("no upstream")
    return "  ".join(parts)


def run(repo: Path, m: Machine, man: Manifest, fetch: bool = False, show_all: bool = False) -> int:
    ws = man.workspace(m)
    head(f"machine {m.name}  profiles {','.join(m.profiles)}  workspace {paths.contract(ws)}")
    marker = paths.state_dir() / "blocked-config"
    blocked = f"  BLOCKED: {marker.read_text().strip()}" if marker.exists() else ""
    info(f"config repo   {_repo_line(repo, fetch)}{blocked}")
    info("")
    rc = 0
    known = set()
    for p in man.projects.values():
        known.add(p.path or p.name)
        sel = p.selected(m)
        if not sel and not show_all:
            continue
        root = p.checkout_root(ws)
        if not sel:
            line = "skipped (profile)"
        elif not root.exists():
            line = "MISSING  (cs clone)"
            rc = 1
        elif p.kind == "git" and gitutil.is_repo(root):
            line = _repo_line(root, fetch)
            url = gitutil.remote_url(root)
            if p.url and gitutil.canonical_github(url) != gitutil.canonical_github(p.url):
                line += f"  URL≠manifest ({url})"
            ident = man.identities.get(p.identity)
            email = gitutil.config_get(root, "user.email")
            if ident and email and email != ident.email:
                line += f"  identity MISMATCH ({email})"
            elif ident and not email:
                line += "  identity UNSET"
            if p.layout == "worktrees":
                line += f"  [{len(gitutil.worktrees(root))} worktrees]"
            if "dirty" in line or "↑" in line:
                rc = 1
        else:
            line = f"{p.kind}"
        info(f"{p.name:<28} {line}")
    unreg = sorted(d.name for d in ws.iterdir() if d.is_dir() and not d.name.startswith(".") and d.name not in known) if ws.exists() else []
    if unreg:
        info("")
        warn("unregistered under workspace: " + ", ".join(unreg) + "   (cs add <path>)")
    return rc
