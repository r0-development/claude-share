"""`cs ssh setup|check`: per-machine SSH keys for every identity.

Naming: ~/.ssh/cs/<identity> (+ .pub), comment and GitHub title `cs:<machine>:<identity>`,
published as machines/<machine>/ssh/<identity>.pub in the config repo.

- generates missing ed25519 keys (no passphrase; disk encryption is assumed)
- publishes the public halves under machines/<machine>/ssh/ in the config repo
- writes a managed block into ~/.ssh/config
- registers pubkeys on GitHub via the owner's token when the owner is a user account,
  otherwise prints what to paste where
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path
from typing import List, Optional

from . import github, gitutil, paths, platform, ui
from .config import Machine
from .manifest import Identity, Manifest

MARK, END = "# >>> claude-share >>>", "# <<< claude-share <<<"


def _keygen(key: Path, comment: str) -> None:
    key.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    subprocess.run(["ssh-keygen", "-q", "-t", "ed25519", "-N", "", "-C", comment, "-f", str(key)], check=True)
    key.chmod(0o600)


def _github_user_for_key(key: Path) -> Optional[str]:
    p = subprocess.run(["ssh", "-T", "-i", str(key), "-o", "IdentitiesOnly=yes", "-o", "StrictHostKeyChecking=accept-new",
                        "-o", "BatchMode=yes", "git@github.com"], capture_output=True, text=True, timeout=20)
    m = re.search(r"Hi ([^!]+)!", p.stdout + p.stderr)
    return m.group(1) if m else None


def _config_block() -> str:
    lines = [MARK, "Host github.com", "    IdentitiesOnly yes", "    AddKeysToAgent yes"]
    if platform.is_macos():
        lines.append("    UseKeychain yes")
    lines.append(END)
    return "\n".join(lines) + "\n"


def write_ssh_config() -> bool:
    cfg = paths.home() / ".ssh" / "config"
    text = cfg.read_text() if cfg.exists() else ""
    block = _config_block()
    if MARK in text:
        new = text[:text.index(MARK)] + block + text[text.index(END) + len(END) + 1:]
    else:
        new = block + ("\n" if text and not text.startswith("\n") else "") + text
    if new == text:
        return False
    cfg.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    cfg.write_text(new)
    cfg.chmod(0o600)
    return True


def _register(ident: Identity, pub: str, title: str) -> str:
    owner = ident.github_owner
    if not owner:
        return "no github_owner; add the key manually"
    tok = github.get_token(owner)
    if not tok:
        return f"no token for {owner}; add manually: https://github.com/settings/ssh/new"
    try:
        if github.owner_type(owner, tok) != "User":
            return f"{owner} is an organization — add the key to the *user* account that belongs to it: https://github.com/settings/ssh/new"
        existing = github.api("GET", "/user/keys", tok)
        if any(k.get("key", "").split()[:2] == pub.split()[:2] for k in existing):
            return "already registered on GitHub"
        github.api("POST", "/user/keys", tok, {"title": title, "key": pub})
        return "registered on GitHub"
    except github.GitHubError as e:
        if " 403 " in str(e) or " 404 " in str(e):
            return f"token lacks 'Git SSH keys: write' (account permission) — add manually: https://github.com/settings/ssh/new"
        return str(e)


def setup(repo: Path, m: Machine, man: Manifest, check_only: bool = False) -> int:
    if not man.identities:
        ui.warn("no identities yet (cs identity add …)")
        return 0
    rows = []
    published = False
    for ident in man.identities.values():
        key = paths.expand(ident.key_path)
        pub_f = key.with_name(key.name + ".pub")
        state: List[str] = []
        if not key.exists():
            if check_only:
                rows.append([ident.id, ident.key_path, ui.red("missing")]); continue
            _keygen(key, f"cs:{m.name}:{ident.id}")
            state.append(ui.green("generated"))
        pub = pub_f.read_text().strip()
        dest = repo / "machines" / m.name / "ssh" / f"{ident.id}.pub"
        if not check_only and (not dest.exists() or dest.read_text().strip() != pub):
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(pub + "\n")
            gitutil.run(["add", str(dest.relative_to(repo))], repo)
            published = True
        user = _github_user_for_key(key)
        if user:
            state.append(ui.green(f"github: {user}"))
        elif not check_only:
            state.append(ui.dim(_register(ident, pub, f"cs:{m.name}:{ident.id}")))
            user = _github_user_for_key(key)
            if user:
                state[-1] = ui.green(f"github: {user}")
        else:
            state.append(ui.red("not accepted by GitHub"))
        rows.append([ident.id, ident.key_path, "  ".join(state)])
    if published:
        gitutil.commit(repo, f"machines: {m.name} ssh public keys", "cs", f"cs@{m.name}")
    if not check_only and write_ssh_config():
        ui.act("~/.ssh/config: managed block (IdentitiesOnly, AddKeysToAgent)")
    ui.table(rows, header=["identity", "key", "state"])
    unregistered = [r for r in rows if "github:" not in r[2]]
    if unregistered:
        for r in unregistered:
            key = paths.expand(r[1]).with_name(paths.expand(r[1]).name + ".pub")
            ident = man.identities.get(r[0])
            if key.exists():
                who = f"the GitHub account that belongs to {ident.github_owner}" if ident and ident.github_owner else "your GitHub account"
                ui.note(f"Add the '{r[0]}' key to {who}",
                        [ui.cyan("https://github.com/settings/ssh/new"), "", ui.bold(key.read_text().strip()), "",
                         ui.dim(f"title suggestion: cs:{m.name}:{r[0]}")])
        return 1
    return 0
