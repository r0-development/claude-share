"""`cs identity add|ls`: git identities in projects.toml."""
from __future__ import annotations

from pathlib import Path
from typing import List, Optional

from . import apply, github, gitutil, manifest as mf, paths, ui
from .config import Machine
from .manifest import Identity, Manifest


def add(repo: Path, m: Machine, man: Manifest, id_: str, *, owner: str, name: str, email: str,
        key: Optional[str], gh_user: str, no_token: bool) -> int:
    if not mf.NAME_RE.match(id_):
        raise SystemExit(f"cs: '{id_}' is not a valid identity id")
    ident = Identity(id=id_, name=name, email=email, ssh_key=key or f"~/.ssh/id_ed25519_{id_}",
                     gh_user=gh_user, github_owner=owner, url_globs=[f"git@github.com:{owner}/**"])
    mf.append_identity(repo, ident)
    gitutil.run(["add", "projects.toml"], repo)
    gitutil.commit(repo, f"identities: add {id_}", "cs", f"cs@{m.name}")
    ui.ok(f"identity '{id_}' → {name} <{email}>, repos under github.com/{owner}, key {ident.ssh_key}")
    man2 = mf.load(repo)
    changes: List[str] = []
    apply.apply_git(man2, False, changes)
    for c in changes:
        ui.act(c)
    keyfile = paths.expand(ident.ssh_key)
    if not keyfile.exists():
        ui.warn(f"{ident.ssh_key} does not exist on this machine yet (cs ssh setup comes in M1; "
                f"for now: ssh-keygen -t ed25519 -f {ident.ssh_key} && add the .pub to github.com/{owner})")
    if not no_token and not github.get_token(owner):
        ui.info(f"  a GitHub token for {owner} lets `cs new --{id_}` create repos:")
        try:
            github.ensure_token(owner)
            ui.ok(f"token for {owner} stored")
        except (github.GitHubError, SystemExit) as e:
            ui.warn(f"no token stored ({e}); run `cs token set {owner}` later")
    return 0


def ls(man: Manifest) -> None:
    rows = []
    for i in man.identities.values():
        tok = "token ✓" if github.get_token(i.github_owner or "") else ui.dim("no token")
        rows.append([ui.bold(i.id), f"{i.name} <{i.email}>", i.github_owner or ui.dim("-"), i.ssh_key, tok])
    ui.table(rows, header=["id", "who", "github owner", "ssh key", ""])
