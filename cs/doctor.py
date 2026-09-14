"""`cs doctor`: environment and consistency checks with fix hints."""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path
from typing import Callable, List, Tuple

from . import apply, gitutil, link, paths, platform
from .config import Machine
from .manifest import Manifest
from .ui import fail, info, ok, warn

Result = Tuple[str, str]   # ("ok"|"warn"|"fail", message)


def _check_python() -> Result:
    v = sys.version_info
    return ("ok", f"python {v.major}.{v.minor}") if v >= (3, 9) else ("fail", "python < 3.9")


def _check_git() -> Result:
    v = gitutil.version()
    if v < (2, 36):
        return ("warn", f"git {'.'.join(map(str, v))} < 2.36: includeIf hasconfig unsupported; identities fall back to per-repo config")
    return ("ok", f"git {'.'.join(map(str, v))}")


def _check_claude() -> Result:
    return ("ok", f"claude at {shutil.which('claude')}") if shutil.which("claude") else ("warn", "claude not on PATH (curl -fsSL https://claude.ai/install.sh | bash)")


def _check_platform() -> Result:
    platform.refuse_unsupported()
    return ("ok", platform.describe())


def _check_mnt(man: Manifest, m: Machine) -> Result:
    ws = man.workspace(m)
    if platform.is_wsl() and str(ws).startswith("/mnt/"):
        return ("fail", f"workspace {ws} is on the Windows filesystem; use the WSL ext4 home")
    return ("ok", f"workspace {paths.contract(ws)}")


def _check_links(repo: Path) -> Result:
    cdir = paths.claude_dir()
    broken = [i for i in apply.LINK_ITEMS + ["plans"] if (cdir / i).is_symlink() and not (cdir / i).exists()]
    if broken:
        return ("fail", "broken links in ~/.claude: " + ", ".join(broken) + "  (cs apply)")
    return ("ok", "~/.claude links healthy")


def _check_settings(repo: Path, m: Machine, man: Manifest) -> Result:
    changes: List[str] = []
    apply.apply_settings(repo, m, True, changes)
    return ("warn", "settings.json drift: " + "; ".join(changes) + "  (cs apply)") if changes else ("ok", "settings.json rendered")


def _check_identities(repo: Path, m: Machine, man: Manifest) -> List[Result]:
    out: List[Result] = []
    ws = man.workspace(m)
    for p in man.selected(m):
        root = p.checkout_root(ws)
        if p.kind != "git" or not root.exists() or not gitutil.is_repo(root):
            continue
        ident = man.identities.get(p.identity)
        email = gitutil.config_get(root, "user.email")
        url = gitutil.remote_url(root)
        if p.url and gitutil.canonical_github(url) != gitutil.canonical_github(p.url):
            out.append(("warn", f"{p.name}: remote {url} ≠ manifest {p.url}  (cs doctor --fix)"))
        elif url and url != p.url and p.url:
            out.append(("warn", f"{p.name}: remote uses alias/other form {url}; manifest {p.url}  (cs doctor --fix)"))
        if ident and email != ident.email:
            out.append(("fail", f"{p.name}: user.email resolves to '{email or 'UNSET'}', expected {ident.email}"))
    return out or [("ok", "git identities resolve per manifest")]


def _check_local_mcp_secrets(man: Manifest, m: Machine) -> Result:
    cj = paths.claude_json()
    if not cj.exists():
        return ("ok", "no ~/.claude.json")
    try:
        data = json.loads(cj.read_text())
    except ValueError:
        return ("warn", "~/.claude.json unparsable")
    hits = []
    for path, entry in data.get("projects", {}).items():
        for name, cfg in (entry.get("mcpServers") or {}).items():
            if cfg.get("env") or cfg.get("headers"):
                hits.append(f"{name}@{paths.contract(Path(path))}")
    if hits:
        return ("warn", "local-scope MCP servers with env/headers in ~/.claude.json (not portable): " + ", ".join(hits) + "  (cs adopt mcp <project>)")
    return ("ok", "no secret-bearing local-scope MCP servers")


def _check_gh_token_env() -> Result:
    import os
    if os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN"):
        return ("warn", "GH_TOKEN/GITHUB_TOKEN is exported in this shell; gh ignores its stored logins while set")
    return ("ok", "no GH_TOKEN override in env")


def fix(repo: Path, m: Machine, man: Manifest) -> None:
    ws = man.workspace(m)
    for p in man.selected(m):
        root = p.checkout_root(ws)
        if p.kind != "git" or not root.exists() or not gitutil.is_repo(root) or not p.url:
            continue
        url = gitutil.remote_url(root)
        if url != p.url and gitutil.canonical_github(url) == gitutil.canonical_github(p.url):
            gitutil.run(["remote", "set-url", "origin", p.url], root)
            ok(f"{p.name}: remote url -> {p.url}")
    apply.run(repo, m, man)


def run(repo: Path, m: Machine, man: Manifest, do_fix: bool = False) -> int:
    if do_fix:
        fix(repo, m, man)
    results: List[Result] = [
        _check_platform(), _check_python(), _check_git(), _check_claude(),
        _check_mnt(man, m), _check_links(repo), _check_settings(repo, m, man),
        _check_local_mcp_secrets(man, m), _check_gh_token_env(),
    ] + _check_identities(repo, m, man)
    rc = 0
    for level, msg in results:
        {"ok": ok, "warn": warn, "fail": fail}[level](msg)
        if level == "fail":
            rc = 1
    return rc
