"""The master key: ~/.ssh/cs/master — one per machine, used ONLY to reach the config repo.

Recommended registration: a deploy key with write access on the config repo (GitHub:
<repo>/settings/keys). Adding it to an account's SSH keys works as well. When an API token for the
repo owner is stored locally, cs registers it as a deploy key automatically.
"""
from __future__ import annotations

import os
import re
import subprocess
from pathlib import Path
from typing import Optional, Tuple

from . import github, paths, ui

KEY = "~/.ssh/cs/master"


def key_path() -> Path:
    return paths.expand(KEY)


def ensure_key(machine_hint: str = "") -> Tuple[Path, str, bool]:
    """(private key path, public key text, created?)"""
    key = key_path()
    pub = key.with_name("master.pub")
    if key.exists() and pub.exists():
        return key, pub.read_text().strip(), False
    key.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    comment = f"cs:{machine_hint or os.uname().nodename}:master"
    subprocess.run(["ssh-keygen", "-q", "-t", "ed25519", "-N", "", "-C", comment, "-f", str(key)], check=True)
    key.chmod(0o600)
    return key, pub.read_text().strip(), True


def parse_repo_url(text: str) -> Tuple[str, Optional[Tuple[str, str]]]:
    """Any pasted form -> (ssh url to use, (owner, repo) if GitHub).
    https://github.com/o/r[.git], github.com/o/r, git@github.com:o/r[.git], ssh://git@github.com/o/r"""
    t = text.strip().rstrip("/")
    m = re.match(r"^(?:https?://|ssh://git@|git@)?(?:www\.)?github\.com[/:]([^/]+)/([^/]+?)(?:\.git)?$", t)
    if m:
        owner, repo = m.group(1), m.group(2)
        return f"git@github.com:{owner}/{repo}.git", (owner, repo)
    return t, None


def https_url(owner: str, repo: str) -> str:
    return f"https://github.com/{owner}/{repo}.git"


def is_public(url: str) -> Optional[bool]:
    """True/False for GitHub https URLs; None when unknown/unreachable."""
    if not url.startswith("https://"):
        return None
    env = dict(os.environ, GIT_TERMINAL_PROMPT="0")
    p = subprocess.run(["git", "ls-remote", "--exit-code", url, "HEAD"], capture_output=True, text=True, env=env, timeout=30)
    if p.returncode == 0:
        return True
    if "Authentication failed" in p.stderr or "could not read Username" in p.stderr or "Repository not found" in p.stderr:
        return False
    return None


def can_access(ssh_url: str) -> Tuple[bool, str]:
    env = dict(os.environ, GIT_SSH_COMMAND=f"ssh -i {key_path()} -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=accept-new")
    p = subprocess.run(["git", "ls-remote", ssh_url, "HEAD"], capture_output=True, text=True, env=env, timeout=30)
    return p.returncode == 0, p.stderr.strip().splitlines()[-1] if p.stderr.strip() else ""


def register_deploy_key(owner: str, repo: str, pub: str, title: str) -> Optional[str]:
    """Try the API with a stored token. Returns a status string, or None when no token."""
    tok = github.get_token(owner)
    if not tok:
        return None
    try:
        keys = github.api("GET", f"/repos/{owner}/{repo}/keys", tok)
        if any(k.get("key", "").split()[:2] == pub.split()[:2] for k in keys):
            return "already a deploy key"
        github.api("POST", f"/repos/{owner}/{repo}/keys", tok, {"title": title, "key": pub, "read_only": False})
        return "registered as deploy key (write)"
    except github.GitHubError as e:
        return f"could not register via API: {e}"


def print_instructions(pub: str, gh: Optional[Tuple[str, str]]) -> None:
    lines = []
    if gh:
        lines += [f"deploy key with write access (recommended): {ui.cyan(f'https://github.com/{gh[0]}/{gh[1]}/settings/keys/new')}",
                  f"or your account's SSH keys:                 {ui.cyan('https://github.com/settings/ssh/new')}", ""]
    lines += [ui.bold(pub), ""]
    lines += [ui.dim("this master key only reaches the config repo; it is separate from your identities")]
    ui.note("Add this machine's master public key to the config repo", lines)


def configure_repo(repo_dir: Path) -> None:
    """Pin the config repo checkout to the master key (beats identity includes)."""
    subprocess.run(["git", "-C", str(repo_dir), "config", "core.sshCommand",
                    f"ssh -i {paths.contract(key_path())} -o IdentitiesOnly=yes"], check=True)


def setup(repo_dir: Path, interactive: bool = True) -> int:
    """`cs ssh master`: ensure the master key exists, can reach the config repo, and the checkout uses it."""
    url = ""
    p = subprocess.run(["git", "-C", str(repo_dir), "remote", "get-url", "origin"], capture_output=True, text=True)
    url = p.stdout.strip()
    if not url:
        ui.warn("config repo has no remote")
        return 1
    ssh_url, gh = parse_repo_url(url)
    key, pub, created = ensure_key()
    ui.kv("master key", f"{KEY}" + ("  (generated)" if created else ""))
    ok, err = can_access(ssh_url)
    if not ok and gh:
        reg = register_deploy_key(gh[0], gh[1], pub, "cs:master")
        if reg:
            ui.info(f"  {reg}")
            ok, err = can_access(ssh_url)
    while not ok:
        print_instructions(pub, gh)
        if not interactive or ui.prompt("press Enter when the key is added (q to abort)", "") == "q":
            return 1
        ok, err = can_access(ssh_url)
    if ssh_url != url:
        subprocess.run(["git", "-C", str(repo_dir), "remote", "set-url", "origin", ssh_url], check=True)
    configure_repo(repo_dir)
    ui.ok(f"config repo uses the master key ({ssh_url})")
    return 0
