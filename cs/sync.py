"""`cs sync`: keep the config repo (and kind=synced projects) in sync with their
remotes without ever leaving a half-rebased tree.

  lock -> copy-back project files -> commit -> fetch (timeout) -> ff / rebase (union attrs)
       -> on conflict: abort, mark blocked -> push (retry once) -> re-apply/link if needed
"""
from __future__ import annotations

import fcntl
import os
import subprocess
import time
from pathlib import Path
from typing import List, Optional

from . import apply, gitutil, link, paths
from .config import Machine
from .manifest import Manifest
from .ui import act, fail, info, ok, warn


class Blocked(Exception):
    pass


def _blocked_marker(label: str) -> Path:
    return paths.state_dir() / f"blocked-{label}"


def _lock(label: str):
    d = paths.state_dir()
    d.mkdir(parents=True, exist_ok=True)
    f = open(d / f"sync-{label}.lock", "w")
    try:
        fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        return None
    return f


def git_sync(repo: Path, label: str, machine: str, *, pull_only: bool = False, push_only: bool = False,
             timeout: int = 20, resolve: Optional[str] = None, quiet: bool = False) -> bool:
    """Returns True when the repo is in sync (or offline but locally committed)."""
    if not gitutil.is_repo(repo):
        warn(f"{label}: not a git repo ({paths.contract(repo)})")
        return False
    marker = _blocked_marker(label)
    if marker.exists() and not resolve:
        fail(f"{label}: sync blocked by an earlier conflict — {marker.read_text().strip()}")
        return False
    lock = _lock(label)
    if lock is None:
        info(f"{label}: another sync is running, skipping")
        return True
    try:
        if not pull_only and gitutil.is_dirty(repo):
            n = gitutil.dirty_count(repo)
            gitutil.run(["add", "-A"], repo)
            gitutil.run(["commit", "-q", "-m", f"sync({machine}): {n} file(s) {time.strftime('%Y-%m-%d %H:%M')}"], repo)
            act(f"{label}: committed {n} change(s)")
        if not gitutil.remote_url(repo):
            ok(f"{label}: no remote configured; local only")
            return True
        try:
            gitutil.run(["fetch", "-q", "--prune", "origin"], repo, timeout=timeout)
        except (gitutil.GitError, subprocess.TimeoutExpired):
            warn(f"{label}: offline or fetch timed out; will push later")
            (paths.state_dir() / f"last-{label}").write_text("offline\n")
            return True
        branch = gitutil.current_branch(repo)
        if not branch:
            fail(f"{label}: detached HEAD; refusing to sync")
            return False
        upstream = gitutil.out(["rev-parse", "--abbrev-ref", "@{upstream}"], repo)
        if not upstream:
            if gitutil.out(["rev-parse", "--verify", "-q", f"origin/{branch}"], repo):
                gitutil.run(["branch", "-q", f"--set-upstream-to=origin/{branch}", branch], repo)
            elif not pull_only:
                gitutil.run(["push", "-q", "-u", "origin", branch], repo, timeout=timeout)
                ok(f"{label}: pushed new branch {branch}")
                return True
            else:
                return True
        ab = gitutil.ahead_behind(repo)
        ahead, behind = ab if ab else (0, 0)
        if behind and not push_only:
            if ahead == 0:
                gitutil.run(["merge", "-q", "--ff-only", "@{upstream}"], repo)
                act(f"{label}: fast-forwarded {behind} commit(s)")
            else:
                args = ["rebase", "-q"]
                if resolve == "ours":
                    args += ["-X", "theirs"]   # during rebase, -X theirs == keep our local commits
                elif resolve == "theirs":
                    args += ["-X", "ours"]
                p = gitutil.run(args + ["@{upstream}"], repo, check=False)
                if p.returncode != 0:
                    conflicts = gitutil.out(["diff", "--name-only", "--diff-filter=U"], repo)
                    gitutil.run(["rebase", "--abort"], repo, check=False)
                    marker.write_text(f"conflict in: {conflicts.replace(chr(10), ', ') or 'unknown'}\n")
                    fail(f"{label}: conflict in {conflicts.replace(chr(10), ', ')}")
                    info(f"  keep mine:   cs sync --resolve ours\n  keep theirs: cs sync --resolve theirs\n"
                         f"  manual:      cd {paths.contract(repo)} && git rebase origin/{branch}  (then: cs sync)")
                    return False
                act(f"{label}: rebased {ahead} local commit(s) onto {behind} remote commit(s)")
        if marker.exists():
            marker.unlink()
        if not pull_only:
            ab = gitutil.ahead_behind(repo)
            if ab and ab[0]:
                p = gitutil.run(["push", "-q", "origin", branch], repo, check=False, timeout=timeout)
                if p.returncode != 0:
                    # race: someone pushed in between; one retry after re-sync
                    warn(f"{label}: push rejected, retrying once")
                    return git_sync(repo, label, machine, pull_only=False, push_only=False,
                                    timeout=timeout, resolve=resolve, quiet=quiet)
                ok(f"{label}: pushed {ab[0]} commit(s)")
        (paths.state_dir() / f"last-{label}").write_text(time.strftime("%Y-%m-%dT%H:%M:%S\n"))
        return True
    finally:
        lock.close()


def run(repo: Path, m: Machine, man: Manifest, *, pull_only=False, push_only=False, timeout=20,
        resolve: Optional[str] = None, projects: bool = True) -> int:
    ws = man.workspace(m)
    rc = 0
    head_before = gitutil.out(["rev-parse", "HEAD"], repo)
    # 1. project files: checkout -> side-store (so they get committed)
    if not pull_only:
        for p in man.selected(m):
            if link.checkouts(p, ws):
                link.sync_project(repo, p, ws)
    # 2. config repo
    if not git_sync(repo, "config", m.name, pull_only=pull_only, push_only=push_only, timeout=timeout, resolve=resolve):
        rc = 2
    # 3. re-apply/link if remote brought changes
    head_after = gitutil.out(["rev-parse", "HEAD"], repo)
    if head_after != head_before or pull_only:
        changed = gitutil.out(["diff", "--name-only", head_before, head_after], repo) if head_before else ""
        if any(x.startswith(("claude/", "projects.toml", "plans/")) for x in changed.splitlines()) or pull_only:
            apply.run(repo, m, man)
        man = __import__("cs.manifest", fromlist=["load"]).load(repo)
        link.run(repo, m, man)
    # 4. kind=synced projects
    if projects and not pull_only:
        for p in man.selected(m):
            if p.kind == "synced":
                root = p.checkout_root(ws)
                if root.exists() and gitutil.is_repo(root):
                    if not git_sync(root, p.name, m.name, timeout=timeout):
                        rc = 2
    return rc
