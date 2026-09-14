"""sops + age backend.

- per-machine age identity: ~/.config/sops/age/keys.txt (0600, never synced)
- public keys committed: <repo>/machines/<machine>/age.pub
- recipients: <repo>/.sops.yaml  (one creation rule for secrets/**/*.env)
- files: sops-encrypted dotenv; every value encrypted, keys visible (diffable)
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
from pathlib import Path
from typing import Dict, List, Optional

from .. import gitutil, paths, ui
from ..config import Machine
from . import dump_dotenv, env_file, parse_dotenv

RULE_RE = r"^secrets/.*\.env$"


def key_file() -> Path:
    return Path(os.environ.get("SOPS_AGE_KEY_FILE") or paths.home() / ".config" / "sops" / "age" / "keys.txt")


def _env() -> Dict[str, str]:
    e = dict(os.environ)
    e["SOPS_AGE_KEY_FILE"] = str(key_file())
    e.pop("SOPS_AGE_RECIPIENTS", None)
    return e


def _sops(args: List[str], repo: Path, check: bool = True, input_: Optional[str] = None) -> subprocess.CompletedProcess:
    exe = shutil.which("sops") or str(paths.home() / ".local" / "bin" / "sops")
    p = subprocess.run([exe, *args], cwd=str(repo), env=_env(), text=True, capture_output=True, input=input_)
    if check and p.returncode != 0:
        raise SystemExit(f"cs: sops {' '.join(args)} failed: {p.stderr.strip()}")
    return p


def _age_keygen() -> str:
    exe = shutil.which("age-keygen") or str(paths.home() / ".local" / "bin" / "age-keygen")
    kf = key_file()
    kf.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    p = subprocess.run([exe, "-o", str(kf)], text=True, capture_output=True)
    if p.returncode != 0:
        raise SystemExit(f"cs: age-keygen failed: {p.stderr.strip()}")
    kf.chmod(0o600)
    return public_key()


def public_key() -> str:
    kf = key_file()
    if not kf.exists():
        return ""
    for line in kf.read_text().splitlines():
        if line.startswith("# public key:"):
            return line.split(":", 1)[1].strip()
    exe = shutil.which("age-keygen") or str(paths.home() / ".local" / "bin" / "age-keygen")
    p = subprocess.run([exe, "-y", str(kf)], text=True, capture_output=True)
    return p.stdout.strip()


def recipients(repo: Path) -> List[str]:
    f = repo / ".sops.yaml"
    if not f.exists():
        return []
    m = re.search(r"age:\s*>-?\s*\n((?:\s+.+\n?)+)", f.read_text())
    if m:
        return [x.strip().rstrip(",") for x in m.group(1).replace("\n", " ").split(",") if x.strip()]
    m = re.search(r"age:\s*(\S.*)", f.read_text())
    return [x.strip() for x in m.group(1).split(",") if x.strip()] if m else []


def write_recipients(repo: Path, recs: List[str]) -> None:
    body = "# sops recipients — managed by `cs secrets init` / `cs enroll` / `cs revoke`\ncreation_rules:\n"
    body += f"  - path_regex: {RULE_RE}\n    age: >-\n"
    body += ",\n".join(f"      {r}" for r in recs) + "\n"
    (repo / ".sops.yaml").write_text(body)


def machine_pub_file(repo: Path, machine: str) -> Path:
    return repo / "machines" / machine / "age.pub"


def updatekeys(repo: Path) -> int:
    n = 0
    for f in sorted((repo / "secrets").rglob("*.env")):
        if _is_encrypted(f):
            _sops(["updatekeys", "-y", str(f.relative_to(repo))], repo)
            n += 1
    return n


def _is_encrypted(f: Path) -> bool:
    try:
        return "sops_version=" in f.read_text()
    except OSError:
        return False


class SopsBackend:
    name = "sops"

    def init(self, repo: Path, m: Machine, interactive: bool) -> None:
        kf = key_file()
        if kf.exists():
            ui.info(f"  [skip] age key present at {paths.contract(kf)}")
        else:
            _age_keygen()
            ui.ok(f"generated age key {paths.contract(kf)} (0600, never synced)")
        pub = public_key()
        pf = machine_pub_file(repo, m.name)
        if not pf.exists() or pf.read_text().strip() != pub:
            pf.parent.mkdir(parents=True, exist_ok=True)
            pf.write_text(pub + "\n")
            gitutil.run(["add", str(pf.relative_to(repo))], repo)
            gitutil.commit(repo, f"machines: {m.name} age.pub", "cs", f"cs@{m.name}")
            ui.ok(f"published {paths.contract(pf)}")
        recs = recipients(repo)
        if not recs:
            write_recipients(repo, [pub])
            gitutil.run(["add", ".sops.yaml"], repo)
            gitutil.commit(repo, "secrets: first recipient", "cs", f"cs@{m.name}")
            ui.ok("this is the first machine: registered as the only recipient")
            self._install_guard(repo)
        elif pub in recs:
            ui.ok("this machine can decrypt secrets")
        else:
            ui.warn(f"this machine is not a recipient yet — on a machine that is, run: cs enroll {m.name}")
        (repo / "secrets" / "projects").mkdir(parents=True, exist_ok=True)

    def _install_guard(self, repo: Path) -> None:
        hook = repo / ".git" / "hooks" / "pre-commit"
        src = paths.tool_root() / "hooks" / "pre-commit-secrets-guard.sh"
        if src.exists() and not hook.exists():
            shutil.copy2(src, hook)
            hook.chmod(0o755)
            ui.ok("installed pre-commit plaintext guard in the config repo")

    def ready(self, repo: Path) -> bool:
        return key_file().exists() and public_key() in recipients(repo)

    def load_env(self, repo: Path, name: str) -> Dict[str, str]:
        f = env_file(repo, name)
        if not f.exists():
            return {}
        p = _sops(["-d", "--input-type", "dotenv", "--output-type", "dotenv", str(f.relative_to(repo))], repo)
        return parse_dotenv(p.stdout)

    def write_env(self, repo: Path, name: str, values: Dict[str, str]) -> Path:
        f = env_file(repo, name)
        f.parent.mkdir(parents=True, exist_ok=True)
        rel = str(f.relative_to(repo))
        p = _sops(["-e", "--input-type", "dotenv", "--output-type", "dotenv", "--filename-override", rel, "/dev/stdin"],
                  repo, input_=dump_dotenv(values))
        f.write_text(p.stdout)
        return f

    def edit(self, repo: Path, name: str) -> None:
        f = env_file(repo, name)
        rel = str(f.relative_to(repo))
        if not f.exists():
            self.write_env(repo, name, {"EXAMPLE_KEY": "value"})
        exe = shutil.which("sops") or str(paths.home() / ".local" / "bin" / "sops")
        subprocess.run([exe, "--input-type", "dotenv", "--output-type", "dotenv", rel], cwd=str(repo), env=_env())

    def status(self, repo: Path, m: Machine) -> None:
        pub = public_key()
        recs = recipients(repo)
        ui.kv("age key", paths.contract(key_file()) + ("" if key_file().exists() else ui.red("  missing")))
        ui.kv("recipient", ui.green("yes") if pub and pub in recs else ui.red("no — cs enroll " + m.name))
        machines = {}
        for pf in sorted((repo / "machines").glob("*/age.pub")):
            machines[pf.read_text().strip()] = pf.parent.name
        ui.kv("recipients", ", ".join(machines.get(r, r[:14] + "…") for r in recs) or "-")
        files = sorted(f.relative_to(repo) for f in (repo / "secrets").rglob("*.env")) if (repo / "secrets").exists() else []
        ui.kv("files", ", ".join(str(f) for f in files) or "-")
