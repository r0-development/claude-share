"""Thin subprocess wrapper around git."""
from __future__ import annotations

import subprocess
from pathlib import Path
from typing import List, Optional, Sequence


class GitError(RuntimeError):
    pass


def run(args: Sequence[str], cwd: Optional[Path] = None, check: bool = True, timeout: Optional[int] = None,
        ssh_key: Optional[str] = None) -> subprocess.CompletedProcess:
    env = None
    if ssh_key:
        import os
        env = dict(os.environ, GIT_SSH_COMMAND=f"ssh -i {ssh_key} -o IdentitiesOnly=yes")
    p = subprocess.run(["git", *args], cwd=str(cwd) if cwd else None, text=True,
                       capture_output=True, timeout=timeout, env=env)
    if check and p.returncode != 0:
        raise GitError(f"git {' '.join(args)} failed in {cwd or '.'}: {p.stderr.strip()}")
    return p


def out(args: Sequence[str], cwd: Optional[Path] = None, default: str = "") -> str:
    p = run(args, cwd, check=False)
    return p.stdout.strip() if p.returncode == 0 else default


def is_repo(path: Path) -> bool:
    return (path / ".git").exists()


def is_bare(path: Path) -> bool:
    return (path / "HEAD").is_file() and (path / "objects").is_dir()


def toplevel(path: Path) -> Optional[Path]:
    t = out(["rev-parse", "--show-toplevel"], path)
    return Path(t) if t else None


def version() -> tuple:
    v = out(["--version"]).split()[-1] if out(["--version"]) else "0.0"
    parts = []
    for x in v.split(".")[:3]:
        digits = "".join(ch for ch in x if ch.isdigit())
        parts.append(int(digits) if digits else 0)
    return tuple(parts)


def remote_url(path: Path, name: str = "origin") -> str:
    return out(["remote", "get-url", name], path)


def current_branch(path: Path) -> str:
    return out(["symbolic-ref", "--short", "-q", "HEAD"], path)


def is_dirty(path: Path) -> bool:
    return bool(out(["status", "--porcelain", "--untracked-files=normal"], path))


def dirty_count(path: Path) -> int:
    s = out(["status", "--porcelain", "--untracked-files=normal"], path)
    return len(s.splitlines()) if s else 0


def ahead_behind(path: Path) -> Optional[tuple]:
    """(ahead, behind) vs upstream, or None if no upstream."""
    s = out(["rev-list", "--left-right", "--count", "@{upstream}...HEAD"], path)
    if not s:
        return None
    behind, ahead = s.split()
    return int(ahead), int(behind)


def worktrees(path: Path) -> List[Path]:
    """All worktree paths (including the main one) for the repo at path."""
    res: List[Path] = []
    for line in out(["worktree", "list", "--porcelain"], path).splitlines():
        if line.startswith("worktree "):
            res.append(Path(line[len("worktree "):]))
    return res


def common_dir(path: Path) -> Path:
    c = out(["rev-parse", "--git-common-dir"], path)
    p = Path(c)
    return p if p.is_absolute() else (path / p).resolve()


def info_exclude(path: Path) -> Path:
    return common_dir(path) / "info" / "exclude"


def commit(path: Path, message: str, fallback_name: str = "cs", fallback_email: str = "cs@localhost") -> None:
    """Commit with the repo's resolved identity, or a fallback when none resolves
    (e.g. the config repo before it has a remote)."""
    args: List[str] = []
    if not config_get(path, "user.email"):
        args = ["-c", f"user.name={fallback_name}", "-c", f"user.email={fallback_email}"]
    run(args + ["commit", "-q", "-m", message], path)


def config_get(path: Path, key: str) -> str:
    return out(["config", "--get", key], path)


def canonical_github(url: str) -> str:
    """Normalize GitHub URL forms to git@github.com:owner/repo.git for comparison.
    Handles ssh aliases (git@github-foo:...), https, and missing .git suffix."""
    u = url.strip()
    if u.startswith("https://github.com/"):
        u = "git@github.com:" + u[len("https://github.com/"):]
    elif u.startswith("ssh://git@github.com/"):
        u = "git@github.com:" + u[len("ssh://git@github.com/"):]
    elif u.startswith("git@github-") and ":" in u:
        # alias host -> real host
        u = "git@github.com:" + u.split(":", 1)[1]
    if not u.endswith(".git"):
        u += ".git"
    return u
