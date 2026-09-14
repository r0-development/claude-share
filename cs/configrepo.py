"""`cs init` — interactive wizard (no arguments) or flag-driven (scripts, tests).

Wizard:
  1. join an existing share (paste any GitHub URL) or create a new one
     - a per-machine MASTER key (~/.ssh/cs/master) is the only thing that reaches the config repo;
       registered as a deploy key on the repo (or an account key)
  2. machine name (existing machines listed) + profiles
  3. identities from the repo -> ssh keys generated/registered, tokens offered
  4. apply, link, secrets, hooks, doctor, optional clone
Every phase is re-runnable and skips what is already done.
"""
from __future__ import annotations

import re
import shutil
from pathlib import Path
from typing import List, Optional, Set

from . import apply, deps, doctor, github, gitutil, identity as identity_mod, link, manifest as mf, master, paths, platform, ui
from .config import Machine, exists as machine_exists, load as load_machine, save as save_machine

CONFIG_REPO_NAME = "claude-share-config"
PHASES = ["deps", "repo", "ssh", "apply", "link", "secrets", "hooks", "doctor"]


# ---------------------------------------------------------------- template
def new(dest: Path, force: bool = False, branch: str = "master") -> Path:
    src = paths.templates_dir() / "config-repo"
    if dest.exists() and any(dest.iterdir()) and not force and not gitutil.is_repo(dest):
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
    if gitutil.is_dirty(dest) or not gitutil.out(["rev-parse", "--verify", "-q", "HEAD"], dest):
        gitutil.commit(dest, "claude-share config skeleton")
    return dest


# ---------------------------------------------------------------- pieces
def _access_loop(ssh_url: str, gh, interactive: bool) -> None:
    """Make sure the master key can reach ssh_url; register/instruct until it can."""
    key, pub, created = master.ensure_key()
    if created:
        ui.step(f"master key generated  {ui.dim(master.KEY)}")
    with ui.spinner("checking access to the config repo…"):
        ok, err = master.can_access(ssh_url)
    if not ok and gh:
        with ui.spinner("registering the master key as a deploy key…"):
            reg = master.register_deploy_key(gh[0], gh[1], pub, f"cs:master:{platform.describe()}")
        if reg:
            ui.step(reg, "ok" if "registered" in reg or "already" in reg else "warn")
            with ui.spinner("checking access…"):
                ok, err = master.can_access(ssh_url)
    tries = 0
    while not ok:
        master.print_instructions(pub, gh)
        if not interactive:
            raise SystemExit("cs: config repo not reachable with the master key (see instructions above)")
        if ui.wait_enter("press Enter once the key is added", "q") == "q" or tries >= 10:
            raise SystemExit("cs: aborted — config repo not reachable")
        tries += 1
        with ui.spinner("checking access…"):
            ok, err = master.can_access(ssh_url)
        if not ok:
            ui.step(f"still no access — {err}", "warn")
    ui.step("config repo reachable with the master key")


def _clone_config(ssh_url: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with ui.spinner("cloning the config repo…"):
        gitutil.run(["clone", "-q", ssh_url, str(target)], ssh_key=str(master.key_path()))
    master.configure_repo(target)
    ui.step(f"config repo cloned to {ui.dim(paths.contract(target))}")


def _ask_url(prompt: str):
    while True:
        raw = ui.prompt(prompt, validate=lambda v: "a URL is required" if not v.strip() else None,
                        placeholder="https://github.com/<owner>/claude-share-config")
        ssh_url, gh = master.parse_repo_url(raw)
        if gh:
            with ui.spinner("looking up the repository…"):
                vis = master.is_public(master.https_url(*gh))
            if vis is True:
                ui.step(f"{gh[0]}/{gh[1]} found (public)")
            elif vis is False:
                ui.step(f"{gh[0]}/{gh[1]} found (private) — access via the master key")
            else:
                ui.step(f"{gh[0]}/{gh[1]} not found or unreachable", "warn")
                if not ui.confirm("use this URL anyway?", False):
                    continue
        return ssh_url, gh


def _join(target: Path, interactive: bool, repo_url: str = "") -> None:
    if target.exists() and gitutil.is_repo(target):
        ui.step(f"config repo already at {ui.dim(paths.contract(target))}", "skip")
        master.configure_repo(target)
        return
    ssh_url, gh = master.parse_repo_url(repo_url) if repo_url else _ask_url("config repo URL (e.g. https://github.com/<owner>/claude-share-config)")
    _access_loop(ssh_url, gh, interactive)
    _clone_config(ssh_url, target)


def _create(target: Path, interactive: bool) -> None:
    name = ui.prompt("name for your new config repo", CONFIG_REPO_NAME, validate=lambda v: None if mf.NAME_RE.match(v) else "letters, digits, . _ - only")
    ui.note(f"Create an empty PRIVATE repository named '{name}' on GitHub",
            [ui.cyan("https://github.com/new"), ui.dim("no README, no .gitignore, no license — completely empty")])
    ssh_url, gh = _ask_url("paste the new repo's URL")
    _access_loop(ssh_url, gh, interactive)
    new(target)
    if not gitutil.remote_url(target):
        gitutil.run(["remote", "add", "origin", ssh_url], target)
    master.configure_repo(target)
    with ui.spinner("pushing the initial config repo…"):
        gitutil.run(["push", "-q", "-u", "origin", gitutil.current_branch(target)], target)
    ui.step(f"config repo initialized and pushed  {ui.dim(ssh_url)}")


def _machine(repo: Path, name: str, profiles: List[str], workspace: Optional[str], interactive: bool) -> Machine:
    if machine_exists():
        m = load_machine()
        changed = False
        for attr, val in (("name", name), ("profiles", profiles), ("workspace", workspace)):
            if val and getattr(m, attr) != val:
                setattr(m, attr, val); changed = True
        if changed:
            save_machine(m); ui.step(f"machine settings updated  {ui.dim(paths.contract(paths.machine_file()))}")
        else:
            ui.step(f"machine {ui.bold(m.name)}  {ui.dim(', '.join(m.profiles))}", "skip")
        return m
    existing = sorted(d.name for d in (repo / "machines").iterdir() if d.is_dir() and d.name != "recovery") if (repo / "machines").exists() else []
    if existing:
        ui.step("machines already in this share: " + ", ".join(ui.bold(x) for x in existing), "info")
    if not name:
        if not interactive:
            raise SystemExit("cs: --name <machine-name> is required")
        default = {"wsl2": "desktop", "macos": "laptop"}.get(platform.describe(), "machine")
        while True:
            name = ui.prompt("name for this machine", default, validate=lambda v: None if mf.NAME_RE.match(v) else "letters, digits, . _ - only (e.g. desktop-work)")
            if name in existing and not ui.confirm(f"'{name}' already exists — re-use it (its published keys will be replaced)?", False):
                continue
            break
    if not profiles:
        known: Set[str] = set()
        try:
            for p in mf.load(repo).projects.values():
                known |= set(p.profiles) - {"all"}
        except SystemExit:
            pass
        default = "personal"
        if interactive and known:
            picked = _multiselect_profiles(sorted(known))
            profiles = picked or [default]
        elif interactive:
            profiles = [x.strip() for x in ui.prompt("profiles for this machine (comma list — project groups it should get)", default).split(",") if x.strip()]
        else:
            profiles = [default]
    if workspace is None and interactive:
        try:
            default_ws = mf.load(repo).workspace_root
        except SystemExit:
            default_ws = "~/dev"
        ws = ui.prompt("where should projects live on this machine", default_ws, validate=lambda v: None if v.startswith(("~", "/")) else "use an absolute path or ~/…")
        ws = "~/" + ws[len(str(paths.home())) + 1:] if ws.startswith(str(paths.home()) + "/") else ws
        if platform.is_wsl() and paths.expand(ws).as_posix().startswith("/mnt/"):
            ui.step("that is the Windows filesystem — git and Claude are far slower there; ~/dev inside WSL is recommended", "warn")
            if not ui.confirm("use it anyway?", False):
                ws = default_ws
        workspace = None if ws == default_ws else ws
        paths.expand(ws).mkdir(parents=True, exist_ok=True)
    m = Machine(name=name, profiles=profiles, workspace=workspace)
    save_machine(m)
    ui.step(f"machine {ui.bold(m.name)}  {ui.dim('profiles ' + ', '.join(m.profiles))}")
    return m


def _multiselect_profiles(known: List[str]) -> List[str]:
    """Pick profiles one at a time via select (simple and robust); 'done' finishes."""
    chosen: List[str] = []
    while True:
        opts = [(k, ("● " if k in chosen else "○ ") + k) for k in known] + [("__new", "＋ new profile…"), ("__done", "done" + (f"  ({', '.join(chosen)})" if chosen else ""))]
        v = ui.select("profiles for this machine — which project groups should it get? (toggle, then done)", opts, len(opts) - 1 if chosen else 0)
        if v == "__done":
            return chosen
        if v == "__new":
            n = ui.prompt("new profile name", validate=lambda x: None if mf.NAME_RE.match(x) else "letters, digits, . _ - only")
            if n and n not in known:
                known.append(n)
            if n and n not in chosen:
                chosen.append(n)
            continue
        if v in chosen:
            chosen.remove(v)
        else:
            chosen.append(v)


def _first_identity(repo: Path, m: Machine, interactive: bool) -> None:
    man = mf.load(repo)
    if man.identities:
        return
    if not interactive:
        ui.warn("no identities yet — add one with `cs identity add <id> --owner <owner> --name .. --email ..`")
        return
    ui.section("first identity")
    ui.step("an identity = a GitHub owner (your login or an org) + the name and email you commit with there", "info")
    id_ = ui.prompt("identity id", "personal", validate=lambda v: None if mf.NAME_RE.match(v) else "letters, digits, . _ - only")
    own = ui.prompt("GitHub owner (your login or an org)", validate=lambda v: None if re.match(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$", v) else "a GitHub login, e.g. octocat")
    name = ui.prompt("git user.name", validate=lambda v: "required" if not v else None)
    email = ui.prompt("git user.email", validate=lambda v: None if re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v) else "not an email address")
    identity_mod.add(repo, m, man, id_, owner=own, name=name, email=email, no_token=True)


def _identities_keys_tokens(repo: Path, m: Machine, interactive: bool, skip: List[str]) -> None:
    man = mf.load(repo)
    if not man.identities:
        return
    if "ssh" not in skip:
        ui.section("identity ssh keys")
        from . import ssh
        rc = ssh.setup(repo, m, man)
        while rc != 0 and interactive:
            if ui.prompt("press Enter after adding the key(s) on GitHub (s to skip)", "") == "s":
                break
            rc = ssh.setup(repo, m, man, check_only=True)
    if interactive:
        missing = [i for i in man.identities.values() if i.github_owner and not github.get_token(i.github_owner)]
        if missing:
            ui.section("GitHub tokens")
            ui.step("a token per owner lets `cs new --<id>` create repos — optional now, `cs token set <owner>` later", "info")
            for i in missing:
                if ui.confirm(f"store a token for {i.github_owner} (identity {i.id}) now?", False):
                    try:
                        github.ensure_token(i.github_owner)
                        ui.ok(f"token for {i.github_owner} stored")
                    except (github.GitHubError, SystemExit) as e:
                        ui.warn(str(e))


def _finish(repo: Path, m: Machine, interactive: bool, skip: List[str]) -> int:
    man = mf.load(repo)
    if "apply" not in skip:
        ui.section("apply ~/.claude")
        apply.run(repo, m, man)
    if "link" not in skip:
        ui.section("link project files")
        link.run(repo, m, man)
    if "secrets" not in skip and m.secrets_backend != "none":
        ui.section("secrets")
        from . import secretscmd
        secretscmd.init(repo, m, interactive)
    if "hooks" not in skip:
        ui.section("automatic sync")
        from . import hooks
        hooks.run(repo, m, "install")
        apply.run(repo, m, mf.load(repo))
    _push(repo)
    rc = 0
    if "doctor" not in skip:
        ui.section("doctor")
        rc = doctor.run(repo, m, man)
    ws = man.workspace(m)
    missing = [p for p in man.selected(m) if p.kind != "local" and not p.checkout_root(ws).exists()]
    if missing and interactive and ui.confirm(f"clone {len(missing)} project(s) now ({', '.join(p.name for p in missing[:6])}{'…' if len(missing) > 6 else ''})?", True):
        from . import projects
        projects.clone(repo, m, man, [])
    ui.outro(ui.bold("done") + "  " + ui.dim("open a new terminal (claude() wrapper) · cs status · cs new <project> --<identity>"))
    return rc


def _push(repo: Path) -> None:
    if not gitutil.remote_url(repo):
        return
    branch = gitutil.current_branch(repo)
    ab = gitutil.ahead_behind(repo)
    if ab is None or ab[0]:
        p = gitutil.run(["push", "-q", "-u", "origin", branch], repo, check=False, timeout=60)
        if p.returncode == 0:
            ui.ok("config repo pushed")
        else:
            ui.fail(f"push failed: {p.stderr.strip()}")


# ---------------------------------------------------------------- entry points
def wizard(install_deps: bool, skip: List[str], repo_url: str = "") -> int:
    target = paths.repo_dir()
    ui.intro("claude-share setup")
    if "deps" not in skip:
        deps.run(install=install_deps)
    already = target.exists() and gitutil.is_repo(target)
    if already:
        ui.step(f"config repo already at {ui.dim(paths.contract(target))}", "skip")
        master.configure_repo(target)
    else:
        if repo_url:
            choice = "join"
        else:
            choice = ui.select("What would you like to do?", [
                ("join", "Join an existing share  — you already have a config repo (from another machine)"),
                ("create", "Create a new share      — first machine, no config repo yet"),
            ])
        ui.section("config repo")
        if choice == "create":
            _create(target, True)
        else:
            _join(target, True, repo_url)
    ui.section("machine")
    m = _machine(target, "", [], None, True)
    _first_identity(target, m, True)
    _identities_keys_tokens(target, m, True, skip)
    return _finish(target, m, True, skip)


def init(repo_url: str = "", owner: str = "", name: str = "", profiles: Optional[List[str]] = None,
         skip: Optional[List[str]] = None, workspace: Optional[str] = None, interactive: bool = True,
         ssh_key: str = "", install_deps: bool = False) -> int:
    skip = skip or []
    for x in skip:
        if x not in PHASES:
            raise SystemExit(f"cs: unknown phase '{x}' (phases: {', '.join(PHASES)})")
    target = paths.repo_dir()
    local_src = paths.expand(repo_url) if repo_url and not ("://" in repo_url or repo_url.startswith("git@")) else None

    if interactive and not name and not local_src and not owner:
        return wizard(install_deps, skip, repo_url)

    # flag-driven / scripted path
    ui.section("machine")
    if not (target.exists() and gitutil.is_repo(target)) and "repo" not in skip:
        ui.section("config repo")
        if local_src:
            if not (gitutil.is_repo(local_src) or gitutil.is_bare(local_src)):
                raise SystemExit(f"cs: {local_src} is not a git repo")
            target.parent.mkdir(parents=True, exist_ok=True)
            gitutil.run(["clone", "-q", str(local_src), str(target)])
            ui.ok(f"config repo cloned from {paths.contract(local_src)}")
        elif repo_url:
            ssh_url, gh = master.parse_repo_url(repo_url)
            if ssh_key:   # explicit key instead of the master key
                target.parent.mkdir(parents=True, exist_ok=True)
                gitutil.run(["clone", "-q", ssh_url, str(target)], ssh_key=str(paths.expand(ssh_key)))
                gitutil.run(["config", "core.sshCommand", f"ssh -i {paths.contract(paths.expand(ssh_key))} -o IdentitiesOnly=yes"], target)
            else:
                _access_loop(ssh_url, gh, interactive)
                _clone_config(ssh_url, target)
        elif owner:
            token = github.ensure_token(owner, interactive)
            url = f"git@github.com:{owner}/{CONFIG_REPO_NAME}.git"
            if github.ensure_repo(owner, CONFIG_REPO_NAME, token, private=True, description="claude-share config (private)"):
                ui.ok(f"created private repo {owner}/{CONFIG_REPO_NAME}")
                new(target)
                gitutil.run(["remote", "add", "origin", url], target)
            else:
                _access_loop(url, (owner, CONFIG_REPO_NAME), interactive)
                _clone_config(url, target)
            _access_loop(url, (owner, CONFIG_REPO_NAME), interactive)
            master.configure_repo(target)
        else:
            raise SystemExit("cs: pass --repo <url|path> or --owner <github-owner>, or run `cs init` without arguments")
    if "deps" not in skip:
        ui.section("prerequisites")
        deps.run(install=install_deps)
    m = _machine(target, name, profiles or [], workspace, interactive)
    _first_identity(target, m, interactive)
    _identities_keys_tokens(target, m, interactive, skip)
    return _finish(target, m, interactive, skip)
