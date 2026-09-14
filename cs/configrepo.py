"""`cs config new|show` and `cs init`."""
from __future__ import annotations

import shutil
from pathlib import Path
from typing import List, Optional

from . import apply, doctor, gitutil, link, manifest as mf, paths
from .config import Machine, exists as machine_exists, load as load_machine, save as save_machine
from .ui import act, head, info, ok, section, warn


def new(dest: Path, force: bool = False) -> Path:
    src = paths.templates_dir() / "config-repo"
    if dest.exists() and any(dest.iterdir()) and not force:
        raise SystemExit(f"cs: {dest} is not empty (use --force to overlay the template)")
    dest.mkdir(parents=True, exist_ok=True)
    for f in src.rglob("*"):
        rel = f.relative_to(src)
        t = dest / rel
        if f.is_dir():
            t.mkdir(parents=True, exist_ok=True)
        elif not t.exists():
            t.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, t)
    for d in ("plans", "projects", "secrets", "claude/skills", "claude/rules", "claude/agents", "machines"):
        (dest / d).mkdir(parents=True, exist_ok=True)
        keep = dest / d / ".gitkeep"
        if not any(x for x in (dest / d).iterdir()):
            keep.touch()
    if not gitutil.is_repo(dest):
        gitutil.run(["init", "-q", "-b", "main"], dest)
        gitutil.run(["add", "-A"], dest)
        gitutil.run(["-c", "user.name=cs", "-c", "user.email=cs@localhost", "commit", "-q", "-m", "claude-share config skeleton"], dest)
    ok(f"config repo created at {paths.contract(dest)} — edit projects.toml, then `cs init --repo {paths.contract(dest)}`")
    return dest


def init(repo_src: str, name: str, profiles: List[str], skip: List[str], workspace: Optional[str] = None) -> int:
    """Phases: repo, machine, apply, link, doctor. (deps/ssh/secrets/clone come in M1.)"""
    head("cs init")
    target = paths.repo_dir()
    src_path = paths.expand(repo_src) if not ("://" in repo_src or repo_src.startswith("git@")) else None

    # phase: repo
    if "repo" not in skip:
        if src_path and src_path.resolve() == target.resolve():
            info("[skip] config repo already in place")
        elif target.exists() and gitutil.is_repo(target):
            info(f"[skip] config repo exists at {paths.contract(target)}")
        elif src_path:
            if not src_path.exists():
                raise SystemExit(f"cs: {src_path} does not exist")
            target.parent.mkdir(parents=True, exist_ok=True)
            if gitutil.is_repo(src_path) or gitutil.is_bare(src_path):
                act(f"clone {paths.contract(src_path)} -> {paths.contract(target)}")
                gitutil.run(["clone", "-q", str(src_path), str(target)])
            else:
                raise SystemExit(f"cs: {src_path} is not a git repo; run `cs config new {src_path}` first")
        else:
            act(f"clone {repo_src} -> {paths.contract(target)}")
            target.parent.mkdir(parents=True, exist_ok=True)
            gitutil.run(["clone", "-q", repo_src, str(target)])

    # phase: machine
    if machine_exists():
        m = load_machine()
        changed = False
        if name and m.name != name:
            m.name, changed = name, True
        if profiles and m.profiles != profiles:
            m.profiles, changed = profiles, True
        if workspace and m.workspace != workspace:
            m.workspace, changed = workspace, True
        if changed:
            save_machine(m)
            act(f"updated {paths.contract(paths.machine_file())}")
        else:
            info("[skip] machine.toml present")
    else:
        if not name:
            raise SystemExit("cs: --name <machine-name> is required the first time")
        m = Machine(name=name, profiles=profiles or ["personal"], workspace=workspace)
        save_machine(m)
        act(f"wrote {paths.contract(paths.machine_file())}")

    man = mf.load(target)
    if "apply" not in skip:
        section("apply ~/.claude")
        apply.run(target, m, man)
    if "link" not in skip:
        section("link project files")
        link.run(target, m, man)
    if "doctor" not in skip:
        section("doctor")
        return doctor.run(target, m, man)
    return 0
