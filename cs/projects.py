"""`cs add`, `cs clone`, `cs project id`."""
from __future__ import annotations

import subprocess
from pathlib import Path
from typing import List, Optional

from . import gitutil, manifest as mf, paths
from .config import Machine
from .manifest import Manifest, Project
from .ui import act, fail, info, ok, warn


def add(repo: Path, m: Machine, man: Manifest, path: Optional[str], *, kind: Optional[str], profiles: List[str],
        identity: Optional[str], name: Optional[str], description: str, no_commit: bool) -> Project:
    ws = man.workspace(m)
    target = Path(path).resolve() if path else Path.cwd().resolve()
    # if inside a git repo, use the toplevel; if that toplevel is <x>/repo, treat <x> as a worktree container
    top = gitutil.toplevel(target) if kind != "local" else None
    layout = "plain"
    if top:
        target = top
        if top.name == "repo" and top.parent != ws:
            target, layout = top.parent, "worktrees"
    try:
        rel = target.relative_to(ws)
    except ValueError:
        raise SystemExit(f"cs: {target} is not under the workspace {paths.contract(ws)}")
    if len(rel.parts) != 1:
        raise SystemExit(f"cs: project must be a direct child of the workspace (got {rel})")
    pname = name or rel.parts[0]
    checkout = target / "repo" if layout == "worktrees" else target
    url, branch = "", ""
    if kind is None:
        kind = "git" if gitutil.is_repo(checkout) and gitutil.remote_url(checkout) else ("synced" if not gitutil.is_repo(checkout) else "git")
    if kind == "git":
        url = gitutil.remote_url(checkout)
        if not url:
            raise SystemExit(f"cs: {checkout} has no origin remote; use --kind synced or push it first")
        url = gitutil.canonical_github(url) if "github" in url else url
        branch = gitutil.current_branch(checkout)
        if not identity:
            ident = man.identity_for_url(url)
            if not ident:
                raise SystemExit(f"cs: no identity matches {url}; pass --identity or add url_globs in projects.toml")
            identity = ident.id
    p = Project(name=pname, kind=kind, path=rel.parts[0] if rel.parts[0] != pname else "", url=url,
                identity=identity or "", profiles=profiles or ["all"], branch=branch, layout=layout, description=description)
    errs = Manifest(man.workspace_root, man.identities, {pname: p}).validate()
    if errs:
        raise SystemExit("cs: " + "; ".join(errs))
    mf.append_project(repo, p)
    ok(f"registered {pname} ({kind}{', ' + url if url else ''}) profiles={','.join(p.profiles)}")
    if not no_commit and gitutil.is_repo(repo):
        gitutil.run(["add", "projects.toml"], repo)
        gitutil.commit(repo, f"projects: add {pname}", "cs", f"cs@{m.name}")
    return p


def clone(repo: Path, m: Machine, man: Manifest, names: List[str], dry_run: bool = False) -> int:
    ws = man.workspace(m)
    rc = 0
    cloned: List[str] = []
    for p in man.selected(m):
        if names and p.name not in names:
            continue
        root = p.checkout_root(ws)
        cont = p.container(ws)
        if root.exists():
            if p.kind == "git" and gitutil.is_repo(root):
                url = gitutil.remote_url(root)
                if p.url and gitutil.canonical_github(url) != gitutil.canonical_github(p.url):
                    fail(f"{p.name}: exists with a different remote ({url}); not touching it")
                    rc = 1
            continue
        if p.kind == "local":
            info(f"{p.name}: local-only, skipped")
            continue
        if p.kind == "synced":
            act(f"{p.name}: mkdir {paths.contract(root)}" + (f" and clone {p.url}" if p.url else ""))
            if not dry_run:
                if p.url:
                    gitutil.run(["clone", "-q", p.url, str(root)])
                else:
                    root.mkdir(parents=True, exist_ok=True)
                cloned.append(p.name)
            continue
        args = ["clone", "-q"]
        if p.branch:
            args += ["-b", p.branch]
        act(f"{p.name}: git clone {p.url} -> {paths.contract(root)}")
        if dry_run:
            continue
        cont.mkdir(parents=True, exist_ok=True)
        try:
            gitutil.run(args + [p.url, str(root)])
        except gitutil.GitError as e:
            fail(str(e))
            rc = 1
            continue
        ident = man.identities.get(p.identity)
        email = gitutil.config_get(root, "user.email")
        if ident and email != ident.email:
            warn(f"{p.name}: user.email resolved to '{email or 'UNSET'}' — setting per-repo identity as fallback")
            gitutil.run(["config", "user.name", ident.name], root)
            gitutil.run(["config", "user.email", ident.email], root)
        if p.post_clone:
            subprocess.run(p.post_clone, shell=True, cwd=str(cont))
        cloned.append(p.name)
    if cloned:
        from . import link
        link.run(repo, m, man, cloned)
    return rc


def project_id(m: Machine, man: Manifest, cwd: Optional[Path] = None) -> Optional[str]:
    p = man.project_for_path(cwd or Path.cwd(), m)
    return p.name if p else None
