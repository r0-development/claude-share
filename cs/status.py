"""`cs status`: one screen — config repo, every selected project, unregistered dirs."""
from __future__ import annotations

from pathlib import Path
from typing import List, Tuple

from . import gitutil, paths, ui
from .config import Machine
from .manifest import Manifest


def _repo_state(path: Path, fetch: bool) -> Tuple[str, str, bool]:
    """(branch, colored state text, attention?)"""
    if not gitutil.is_repo(path):
        return ("", ui.dim("not a git repo"), False)
    if fetch:
        gitutil.run(["fetch", "-q", "--prune"], path, check=False, timeout=15)
    branch = gitutil.current_branch(path) or ui.red("DETACHED")
    dirty = gitutil.dirty_count(path)
    ab = gitutil.ahead_behind(path)
    bits: List[str] = []
    attention = False
    if dirty:
        bits.append(ui.yellow(f"{dirty} dirty")); attention = True
    if ab:
        if ab[0]:
            bits.append(ui.yellow(f"↑{ab[0]} unpushed")); attention = True
        if ab[1]:
            bits.append(ui.cyan(f"↓{ab[1]} behind"))
    elif "DETACHED" not in branch:
        bits.append(ui.dim("no upstream"))
    if not bits:
        bits.append(ui.green("clean"))
    return (branch, "  ".join(bits), attention)


def run(repo: Path, m: Machine, man: Manifest, fetch: bool = False, show_all: bool = False) -> int:
    ws = man.workspace(m)
    ui.head(f"{ui.bold(m.name)}  {ui.dim('profiles')} {', '.join(m.profiles)}  {ui.dim('workspace')} {paths.contract(ws)}")
    branch, state, _ = _repo_state(repo, fetch)
    marker = paths.state_dir() / "blocked-config"
    if marker.exists():
        state += "  " + ui.red("BLOCKED: " + marker.read_text().strip())
    ui.table([[ui.bold("config repo"), branch, state]])
    rc = 0
    rows: List[List[str]] = []
    known = set()
    for p in man.projects.values():
        known.add(p.path or p.name)
        sel = p.selected(m)
        if not sel and not show_all:
            continue
        root = p.checkout_root(ws)
        kind = ui.dim(p.kind + (" ⑂" if p.layout == "worktrees" else ""))
        if not sel:
            rows.append([p.name, kind, "", ui.dim("skipped (profile)")]); continue
        if not root.exists():
            rows.append([p.name, kind, "", ui.red("missing") + ui.dim("  cs clone")]); rc = 1; continue
        if p.kind == "git" and gitutil.is_repo(root):
            branch, state, attention = _repo_state(root, fetch)
            url = gitutil.remote_url(root)
            if p.url and gitutil.canonical_github(url) != gitutil.canonical_github(p.url):
                state += "  " + ui.red(f"remote≠manifest ({url})"); attention = True
            ident = man.identities.get(p.identity)
            email = gitutil.config_get(root, "user.email")
            if ident and email and email != ident.email:
                state += "  " + ui.red(f"identity {email}"); attention = True
            elif ident and not email:
                state += "  " + ui.red("identity unset"); attention = True
            if p.layout == "worktrees":
                state += "  " + ui.dim(f"{len(gitutil.worktrees(root))} worktrees")
            if attention:
                rc = 1
            rows.append([p.name, kind, branch, state])
        else:
            rows.append([p.name, kind, "", ui.green("present")])
    ui.info("")
    ui.table(rows, header=["project", "kind", "branch", "state"])
    unreg = sorted(d.name for d in ws.iterdir() if d.is_dir() and not d.name.startswith(".") and d.name not in known) if ws.exists() else []
    if unreg:
        ui.info("")
        ui.warn("unregistered under workspace: " + ", ".join(unreg) + ui.dim("   (cs add <path>)"))
    return rc
