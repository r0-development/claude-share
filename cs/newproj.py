"""`cs new <name>`: brand-new project in one command.

mkdir -> git init -b <default_branch> -> create GitHub repo (API token) -> remote -> first commit
-> push -> register in projects.toml -> link Claude files.
Every step is skipped when already done, so the command can be re-run after a failure.
"""
from __future__ import annotations

from pathlib import Path
from typing import List, Optional

from . import github, gitutil, link, manifest as mf, paths
from .config import Machine
from .manifest import Identity, Manifest, Project
from . import ui
from .ui import act, fail, info, kv, ok, section, warn


def run(repo: Path, m: Machine, man: Manifest, name: str, ident: Identity, *, profiles: List[str],
        description: str = "", private: bool = True, no_github: bool = False, kind: str = "git") -> int:
    if not mf.NAME_RE.match(name):
        raise SystemExit(f"cs: '{name}' is not a valid project name")
    if name in man.projects:
        raise SystemExit(f"cs: project '{name}' is already registered")
    ws = man.workspace(m)
    root = ws / name
    branch = man.default_branch
    owner = ident.github_owner
    if kind == "git" and not owner and not no_github:
        raise SystemExit(f"cs: identity '{ident.id}' has no github_owner in projects.toml")
    url = f"git@github.com:{owner}/{name}.git" if owner else ""

    ui.intro(f"new project {ui.bold(name)}")
    kv("identity", f"{ident.id}  {ui.dim(f'{ident.name} <{ident.email}>')}")
    kv("path", paths.contract(root))
    if kind == "git":
        kv("remote", url or ui.dim("(none)"))
        kv("branch", branch)
    kv("profiles", ", ".join(profiles))
    ui.info(ui.gray(ui.BAR))

    # 1. directory + git init
    root.mkdir(parents=True, exist_ok=True)
    if kind == "git" and not gitutil.is_repo(root):
        gitutil.run(["init", "-q", "-b", branch], root)
        ui.step(f"git init -b {branch}")
    if kind != "git":
        gitutil.run(["init", "-q", "-b", branch], root) if not gitutil.is_repo(root) else None

    # 2. GitHub repo
    if kind == "git" and not no_github and url:
        try:
            token = github.ensure_token(owner)
            with ui.spinner(f"creating {owner}/{name} on GitHub…"):
                exists = github.repo_exists(owner, name, token)
                r = None if exists else github.create_repo(owner, name, token, private=private, description=description)
            if exists:
                ui.step(f"github: {owner}/{name} already exists", "skip")
            else:
                ui.step(f"github: created {r.get('full_name', owner + '/' + name)}  {ui.dim('private' if private else 'public')}")
        except github.GitHubError as e:
            fail(str(e))
            if " 403 " in str(e):
                info("  fine-grained token needs: Repository access = All repositories, "
                     "and Administration = Read and write (edit the token on GitHub; no need to re-run `cs token set`)")
            return 1

    # 3. remote (before the first commit so the identity include resolves)
    if kind == "git" and url:
        cur = gitutil.remote_url(root)
        if not cur:
            gitutil.run(["remote", "add", "origin", url], root)
            ui.step(f"remote origin  {ui.dim(url)}")
        elif gitutil.canonical_github(cur) != gitutil.canonical_github(url):
            fail(f"{root} already has origin {cur}")
            return 1
    email = gitutil.config_get(root, "user.email")
    if email != ident.email:
        if url:
            warn(f"git identity resolved to '{email or 'UNSET'}' (expected {ident.email}); setting it per-repo. Run `cs apply` to fix globally.")
        else:
            info(f"  no remote: git identity set per-repo ({ident.email})")
        gitutil.run(["config", "user.name", ident.name], root)
        gitutil.run(["config", "user.email", ident.email], root)
        if ident.key_path:
            gitutil.run(["config", "core.sshCommand", f"ssh -i {paths.contract(paths.expand(ident.key_path))} -o IdentitiesOnly=yes"], root)

    # 4. first commit + push
    if not gitutil.out(["rev-parse", "--verify", "-q", "HEAD"], root):
        readme = root / "README.md"
        if not readme.exists():
            readme.write_text(f"# {name}\n\n{description}\n".rstrip() + "\n")
        gitignore = root / ".gitignore"
        if not gitignore.exists():
            gitignore.write_text(".DS_Store\n*:Zone.Identifier\n.env\n")
        gitutil.run(["add", "-A"], root)
        gitutil.commit(root, "init", ident.name, ident.email)
        ui.step(f"first commit on {branch}  {ui.dim(f'{ident.name} <{ident.email}>')}")
    if kind == "git" and url and not no_github:
        if not gitutil.ahead_behind(root):
            try:
                with ui.spinner("pushing…"):
                    gitutil.run(["push", "-q", "-u", "origin", branch], root, timeout=60)
                ui.step(f"pushed {branch} to {owner}/{name}")
            except gitutil.GitError as e:
                fail(str(e))
                return 1

    # 5. register + link
    p = Project(name=name, kind=kind, url=url if kind == "git" else "", identity=ident.id if kind == "git" else "",
                profiles=profiles, branch=branch if kind == "git" else "", description=description)
    if kind == "git" and not url:
        p.kind = "local"
    mf.append_project(repo, p)
    if gitutil.is_repo(repo):
        gitutil.run(["add", "projects.toml"], repo)
        gitutil.commit(repo, f"projects: add {name}", "cs", f"cs@{m.name}")
    ui.step(f"registered in projects.toml  {ui.dim(f'{p.kind}, profiles {",".join(profiles)}')}")
    man2 = mf.load(repo)
    ui.set_quiet(True)
    link.run(repo, m, man2, [name])
    ui.set_quiet(False)
    ui.step("Claude files linked (memory → config repo)")
    ui.outro(ui.bold(f"cd {paths.contract(root)} && claude"))
    return 0
