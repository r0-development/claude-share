"""GitHub REST API via a per-identity fine-grained token (no gh CLI needed).

Tokens live in ~/.config/claude-share/tokens/<identity> (0600, never synced) or
the env var CS_GITHUB_TOKEN_<IDENTITY>. Required token permissions on the owner:
Repository administration (read/write) and Metadata (read); for an organization
owner the token must be authorized for that org.
"""
from __future__ import annotations

import getpass
import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional

from . import paths

API = "https://api.github.com"


class GitHubError(RuntimeError):
    pass


def token_file(identity: str) -> Path:
    return paths.cs_config_dir() / "tokens" / identity


def get_token(identity: str) -> Optional[str]:
    env = os.environ.get(f"CS_GITHUB_TOKEN_{identity.upper().replace('-', '_')}")
    if env:
        return env.strip()
    f = token_file(identity)
    if f.exists():
        return f.read_text().strip() or None
    return None


def set_token(identity: str, token: Optional[str] = None) -> Path:
    if not token:
        token = getpass.getpass(f"GitHub token for identity '{identity}' (input hidden): ").strip()
    if not token:
        raise SystemExit("cs: empty token")
    f = token_file(identity)
    f.parent.mkdir(parents=True, exist_ok=True)
    f.parent.chmod(0o700)
    f.write_text(token + "\n")
    f.chmod(0o600)
    return f


def api(method: str, path: str, token: str, body: Optional[Dict[str, Any]] = None) -> Any:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "claude-share",
        **({"Content-Type": "application/json"} if data else {}),
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        try:
            msg = json.loads(e.read()).get("message", "")
        except Exception:
            msg = ""
        raise GitHubError(f"GitHub {method} {path}: {e.code} {msg}".strip())
    except urllib.error.URLError as e:
        raise GitHubError(f"GitHub unreachable: {e.reason}")


def whoami(token: str) -> str:
    return api("GET", "/user", token)["login"]


def owner_type(owner: str, token: str) -> str:
    """'User' or 'Organization'."""
    return api("GET", f"/users/{owner}", token)["type"]


def repo_exists(owner: str, name: str, token: str) -> bool:
    try:
        api("GET", f"/repos/{owner}/{name}", token)
        return True
    except GitHubError as e:
        if " 404 " in str(e) or str(e).endswith("404"):
            return False
        raise


def create_repo(owner: str, name: str, token: str, private: bool = True, description: str = "") -> Dict[str, Any]:
    body = {"name": name, "private": private, "description": description, "auto_init": False}
    if owner_type(owner, token) == "Organization":
        return api("POST", f"/orgs/{owner}/repos", token, body)
    me = whoami(token)
    if me.lower() != owner.lower():
        raise GitHubError(f"token belongs to '{me}', cannot create repos for user '{owner}'")
    return api("POST", "/user/repos", token, body)
