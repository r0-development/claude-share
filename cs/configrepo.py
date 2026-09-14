"""`cs config new` and `cs init` (first-run wizard / later-machine setup).

cs init                      interactive first run: machine → GitHub owner + token → create & push
                             claude-share-config → first identity → apply → link → doctor
cs init --repo <git-url>     later machine: clone the existing config repo, then apply/link/doctor
All phases are re-runnable; each is skipped when already satisfied.
"""
from __future__ import annotations

import shutil
from pathlib import Path
from typing import List, Optional

from . import apply, doctor, github, gitutil, identity as identity_mod, link, manifest as mf, paths, platform, ui
from .config import Machine, exists as machine_exists, load as load_machine, save as save_machine

CONFIG_REPO_NAME = "claude-share-config"


def new(dest: Path, force: bool = False, branch: str = "master") -> Path:
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
        if not any((dest / d).iterdir()):
            (dest / d / ".gitkeep").touch()
    if not gitutil.is_repo(dest):
        gitutil.run(["init", "-q", "-b", branch], dest)
        gitutil.run(["add", "-A"], dest)
        gitutil.commit(dest, "claude-share config skeleton")
    return dest


def _phase_machine(name: str, profiles: List[str], workspace: Optional[str], interactive: bool) -> Machine:
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
            ui.act(f"updated {paths.contract(paths.machine_file())}")
        else:
            ui.info(f"  [skip] machine {ui.bold(m.name)} ({', '.join(m.profiles)})")
        return m
    if not name:
        if not interactive:
            raise SystemExit("cs: --name <machine-name> is required")
        default = {"wsl2": "desktop", "macos": "laptop"}.get(platform.describe(), "machine")
        name = ui.prompt("machine name (e.g. desktop-personal, work-mac)", default)
    if not profiles:
        profiles = [x.strip() for x in ui.prompt("profiles (comma list; projects tagged with these are cloned here)", "personal").split(",") if x.strip()] if interactive else ["personal"]
    m = Machine(name=name, profiles=profiles, workspace=workspace)
    save_machine(m)
    ui.ok(f"machine {ui.bold(m.name)} profiles {', '.join(m.profiles)} → {paths.contract(paths.machine_file())}")
    return m


def _phase_repo(m: Machine, repo_url: str, owner: str, interactive: bool) -> Path:
    target = m.repo_dir
    if repo_url and not ("://" in repo_url or repo_url.startswith("git@")):
        src = paths.expand(repo_url)
        if src.resolve() == target.resolve():
            repo_url = ""
        elif gitutil.is_repo(src) or gitutil.is_bare(src):
            if not target.exists():
                ui.act(f"clone {paths.contract(src)} → {paths.contract(target)}")
                target.parent.mkdir(parents=True, exist_ok=True)
                gitutil.run(["clone", "-q", str(src), str(target)])
            return target
        else:
            raise SystemExit(f"cs: {src} is not a git repo")
    if repo_url:
        if target.exists() and gitutil.is_repo(target):
            ui.info(f"  [skip] config repo present at {paths.contract(target)}")
        else:
            ui.act(f"clone {repo_url} → {paths.contract(target)}")
            target.parent.mkdir(parents=True, exist_ok=True)
            gitutil.run(["clone", "-q", repo_url, str(target)])
        return target

    # no --repo: local repo exists?  ensure it has a remote; else create everything under <owner>
    exists = target.exists() and gitutil.is_repo(target)
    if exists and gitutil.remote_url(target):
        ui.info(f"  [skip] config repo present at {paths.contract(target)} ({gitutil.remote_url(target)})")
        return target
    if not owner:
        if not interactive:
            raise SystemExit("cs: pass --repo <git-url> (existing config repo) or --owner <github-user-or-org> (create one)")
        default = ""
        if exists:
            try:
                ids = mf.load(target).identities
                default = next((i.github_owner for i in ids.values() if i.github_owner), "")
            except SystemExit:
                pass
        owner = ui.prompt("GitHub user/org that will own your private config repo", default)
        if not owner:
            raise SystemExit("cs: an owner is required")
    token = github.ensure_token(owner, interactive)
    ui.ok(f"GitHub token for {owner} ok (authenticates as {github.whoami(token)})")
    url = f"git@github.com:{owner}/{CONFIG_REPO_NAME}.git"
    if github.ensure_repo(owner, CONFIG_REPO_NAME, token, private=True, description="claude-share config (private)"):
        ui.ok(f"created private repo {owner}/{CONFIG_REPO_NAME}")
        remote_is_new = True
    else:
        ui.info(f"  {owner}/{CONFIG_REPO_NAME} already exists on GitHub")
        remote_is_new = False
    if not exists:
        if remote_is_new:
            new(target)
            ui.ok(f"config repo initialized at {paths.contract(target)}")
        else:
            ui.act(f"clone {url} → {paths.contract(target)}")
            target.parent.mkdir(parents=True, exist_ok=True)
            gitutil.run(["clone", "-q", url, str(target)])
            return target
    gitutil.run(["remote", "add", "origin", url], target)
    ui.act(f"remote origin → {url}")
    return target


def _phase_first_identity(repo: Path, m: Machine, owner: str, interactive: bool) -> None:
    man = mf.load(repo)
    if man.identities:
        return
    if not interactive:
        ui.warn("no identities yet — add one with `cs identity add <id> --owner <owner> --name .. --email ..`")
        return
    ui.section("first git identity")
    ui.info(f"  Commits and repo creation under github.com/{owner or '<owner>'} will use this identity.")
    id_ = ui.prompt("identity id", "personal")
    own = ui.prompt("GitHub owner (user/org) for this identity", owner)
    name = ui.prompt("git user.name")
    email = ui.prompt("git user.email")
    keys = sorted(p.name for p in (paths.home() / ".ssh").glob("id_*") if not p.name.endswith(".pub")) if (paths.home() / ".ssh").exists() else []
    key = ui.prompt(f"ssh private key for github.com/{own}" + (f" (have: {', '.join(keys)})" if keys else ""), f"~/.ssh/id_ed25519_{id_}")
    identity_mod.add(repo, m, man, id_, owner=own, name=name, email=email, key=key, gh_user="", no_token=True)


def _phase_push(repo: Path) -> None:
    if not gitutil.remote_url(repo):
        return
    if gitutil.ahead_behind(repo) is not None:
        return
    branch = gitutil.current_branch(repo)
    try:
        gitutil.run(["push", "-q", "-u", "origin", branch], repo, timeout=60)
        ui.ok(f"pushed config repo ({branch}) to {gitutil.remote_url(repo)}")
    except gitutil.GitError as e:
        ui.fail(f"push failed: {e}")
        ui.info("  (is the SSH key for this owner registered on GitHub? `ssh -T git@github.com -i <key>`)")


def init(repo_url: str = "", owner: str = "", name: str = "", profiles: Optional[List[str]] = None,
         skip: Optional[List[str]] = None, workspace: Optional[str] = None, interactive: bool = True) -> int:
    skip = skip or []
    ui.section("machine")
    m = _phase_machine(name, profiles or [], workspace, interactive)
    ui.section("config repo")
    repo = _phase_repo(m, repo_url, owner, interactive) if "repo" not in skip else m.repo_dir
    _phase_first_identity(repo, m, owner, interactive)
    man = mf.load(repo)
    if "apply" not in skip:
        ui.section("apply ~/.claude")
        apply.run(repo, m, man)
    _phase_push(repo)
    if "link" not in skip:
        ui.section("link project files")
        link.run(repo, m, man)
    if "doctor" not in skip:
        ui.section("doctor")
        rc = doctor.run(repo, m, man)
    else:
        rc = 0
    ui.info("")
    if not man.identities:
        ui.info("next: " + ui.bold("cs identity add personal --owner <github-user> --name \"..\" --email .."))
    ui.info("next: " + ui.bold("cs new <project> --<identity>") + "   " + ui.dim("cs status · cs sync · cs --help"))
    return rc
