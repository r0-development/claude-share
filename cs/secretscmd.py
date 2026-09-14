"""`cs secrets ...`, `cs enroll`, `cs revoke`."""
from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Optional

from . import gitutil, paths, ui
from .config import Machine
from .manifest import Manifest
from .secrets import env_file, get as get_backend, parse_dotenv, dump_dotenv


def _mask(v: str) -> str:
    return v[:3] + "…" + v[-2:] if len(v) > 8 else "…"


def init(repo: Path, m: Machine, interactive: bool = True) -> int:
    get_backend(m).init(repo, m, interactive)
    return 0


def status(repo: Path, m: Machine) -> int:
    ui.head(f"secrets backend: {m.secrets_backend}")
    get_backend(m).status(repo, m)
    return 0


def edit(repo: Path, m: Machine, name: str) -> int:
    b = get_backend(m)
    b.edit(repo, name)
    _commit(repo, m, f"secrets: edit {name}")
    return 0


def set_values(repo: Path, m: Machine, name: str, pairs: List[str]) -> int:
    b = get_backend(m)
    values = b.load_env(repo, name)
    for p in pairs:
        if "=" not in p:
            raise SystemExit(f"cs: expected KEY=VALUE, got '{p}'")
        k, v = p.split("=", 1)
        values[k.strip()] = v
    b.write_env(repo, name, values)
    _commit(repo, m, f"secrets: set {len(pairs)} value(s) in {name}")
    ui.ok(f"{name}: {', '.join(p.split('=', 1)[0] for p in pairs)} stored (encrypted)")
    return 0


def unset_values(repo: Path, m: Machine, name: str, keys: List[str]) -> int:
    b = get_backend(m)
    values = b.load_env(repo, name)
    for k in keys:
        values.pop(k, None)
    b.write_env(repo, name, values)
    _commit(repo, m, f"secrets: unset {len(keys)} value(s) in {name}")
    return 0


def get(repo: Path, m: Machine, name: str, key: Optional[str], show: bool) -> int:
    values = get_backend(m).load_env(repo, name)
    if key:
        if key not in values:
            return 1
        print(values[key] if show else _mask(values[key]))
        return 0
    for k, v in values.items():
        print(f"{k}={v if show else _mask(v)}")
    return 0


def pull(repo: Path, m: Machine, man: Manifest, project: str, force: bool) -> int:
    p = man.projects.get(project)
    if not p:
        raise SystemExit(f"cs: unknown project '{project}'")
    values = get_backend(m).load_env(repo, project)
    if not values:
        ui.warn(f"no secrets stored for {project} (cs secrets push {project} / cs secrets set {project} K=V)")
        return 1
    target = p.checkout_root(man.workspace(m)) / ".env"
    text = dump_dotenv(values)
    if target.exists() and target.read_text() != text and not force:
        ui.fail(f"{paths.contract(target)} exists and differs — `cs secrets diff {project}`; use --force to overwrite")
        return 1
    target.write_text(text)
    target.chmod(0o600)
    _check_ignored(p.checkout_root(man.workspace(m)), target)
    ui.ok(f"wrote {paths.contract(target)} ({len(values)} keys)")
    return 0


def push(repo: Path, m: Machine, man: Manifest, project: str) -> int:
    p = man.projects.get(project)
    if not p:
        raise SystemExit(f"cs: unknown project '{project}'")
    src = p.checkout_root(man.workspace(m)) / ".env"
    if not src.exists():
        raise SystemExit(f"cs: {paths.contract(src)} not found")
    values = parse_dotenv(src.read_text())
    get_backend(m).write_env(repo, project, values)
    _commit(repo, m, f"secrets: {project} .env")
    _check_ignored(p.checkout_root(man.workspace(m)), src)
    ui.ok(f"{project}: {len(values)} keys encrypted into {paths.contract(env_file(repo, project))}")
    return 0


def diff(repo: Path, m: Machine, man: Manifest, project: str) -> int:
    p = man.projects.get(project)
    if not p:
        raise SystemExit(f"cs: unknown project '{project}'")
    stored = get_backend(m).load_env(repo, project)
    local_f = p.checkout_root(man.workspace(m)) / ".env"
    local = parse_dotenv(local_f.read_text()) if local_f.exists() else {}
    rows = []
    for k in sorted(set(stored) | set(local)):
        a, b = stored.get(k), local.get(k)
        if a == b:
            continue
        rows.append([k, _mask(a) if a is not None else ui.dim("-"), _mask(b) if b is not None else ui.dim("-")])
    if rows:
        ui.table(rows, header=["key", "stored", "local .env"])
        return 1
    ui.ok("no differences")
    return 0


def _check_ignored(root: Path, f: Path) -> None:
    if gitutil.is_repo(root):
        p = gitutil.run(["check-ignore", "-q", str(f)], root, check=False)
        if p.returncode != 0:
            ui.warn(f"{f.name} is NOT gitignored in {paths.contract(root)} — add it to .gitignore")


def environment(repo: Path, m: Machine, man: Manifest, project: Optional[str], warn_missing: bool = True) -> Dict[str, str]:
    """os.environ + global secrets + project secrets (project wins)."""
    env = dict(os.environ)
    if env.get("CS_SECRETS_LOADED") == "1":
        return env
    b = get_backend(m)
    if b.name != "none" and not b.ready(repo):
        if warn_missing:
            ui.warn("secrets not available on this machine (cs secrets init / cs enroll) — continuing without them")
        return env
    env.update(b.load_env(repo, "global"))
    if project:
        env.update(b.load_env(repo, project))
    env["CS_SECRETS_LOADED"] = "1"
    return env


def exec_(repo: Path, m: Machine, man: Manifest, project: Optional[str], cmd: List[str]) -> int:
    if not cmd:
        raise SystemExit("cs: secrets exec needs a command after --")
    if project is None:
        p = man.project_for_path(Path.cwd(), m)
        project = p.name if p else None
    env = environment(repo, m, man, project)
    exe = shutil.which(cmd[0]) or cmd[0]
    os.execvpe(exe, cmd, env)
    return 0  # unreachable


def enroll(repo: Path, m: Machine, machine: str) -> int:
    from .secrets import sops as S
    pf = S.machine_pub_file(repo, machine)
    if not pf.exists():
        raise SystemExit(f"cs: {paths.contract(pf)} not found — run `cs secrets init` on {machine} and `cs sync` on both sides first")
    pub = pf.read_text().strip()
    recs = S.recipients(repo)
    if pub in recs:
        ui.ok(f"{machine} is already a recipient")
        return 0
    S.write_recipients(repo, recs + [pub])
    n = S.updatekeys(repo)
    gitutil.run(["add", "-A", ".sops.yaml", "secrets"], repo)
    gitutil.commit(repo, f"secrets: enroll {machine}", "cs", f"cs@{m.name}")
    ui.ok(f"enrolled {machine}; re-encrypted {n} file(s). Run `cs sync` here, then `cs sync` on {machine}.")
    return 0


def revoke(repo: Path, m: Machine, machine: str) -> int:
    from .secrets import sops as S
    pf = S.machine_pub_file(repo, machine)
    pub = pf.read_text().strip() if pf.exists() else ""
    recs = [r for r in S.recipients(repo) if r != pub]
    if pub and pub in S.recipients(repo):
        S.write_recipients(repo, recs)
        n = S.updatekeys(repo)
        if pf.exists():
            gitutil.run(["rm", "-q", "-r", str(pf.parent.relative_to(repo))], repo)
        gitutil.run(["add", "-A", ".sops.yaml", "secrets"], repo)
        gitutil.commit(repo, f"secrets: revoke {machine}", "cs", f"cs@{m.name}")
        ui.ok(f"revoked {machine}; re-encrypted {n} file(s)")
    else:
        ui.warn(f"{machine} was not a recipient")
    b = get_backend(m)
    keys = set()
    for f in sorted((repo / "secrets").rglob("*.env")):
        name = "global" if f.name == "global.env" else f.stem
        keys |= set(b.load_env(repo, name))
    if keys:
        ui.warn("that machine could read these — rotate them at the source: " + ", ".join(sorted(keys)))
    return 0


def recovery(repo: Path, m: Machine) -> int:
    """Generate a recovery age key: pub committed as recipient, private printed ONCE."""
    import subprocess, tempfile
    from .secrets import sops as S
    exe = shutil.which("age-keygen") or str(paths.home() / ".local" / "bin" / "age-keygen")
    with tempfile.TemporaryDirectory() as td:
        kf = Path(td) / "recovery.txt"
        subprocess.run([exe, "-o", str(kf)], check=True, capture_output=True)
        text = kf.read_text()
    pub = next(l.split(":", 1)[1].strip() for l in text.splitlines() if l.startswith("# public key:"))
    priv = next(l for l in text.splitlines() if l.startswith("AGE-SECRET-KEY-"))
    pf = S.machine_pub_file(repo, "recovery")
    pf.parent.mkdir(parents=True, exist_ok=True)
    pf.write_text(pub + "\n")
    S.write_recipients(repo, S.recipients(repo) + [pub])
    n = S.updatekeys(repo)
    gitutil.run(["add", "-A", ".sops.yaml", "secrets", "machines/recovery"], repo)
    gitutil.commit(repo, "secrets: recovery recipient", "cs", f"cs@{m.name}")
    ui.ok(f"recovery recipient added; re-encrypted {n} file(s)")
    ui.info("")
    ui.info(ui.bold("Store this in your password manager now — it is not saved anywhere else:"))
    print(priv)
    ui.info(ui.dim("On a bare machine: write it to ~/.config/sops/age/keys.txt, run `cs secrets init`, enroll the machine's own key, delete it."))
    return 0


def _commit(repo: Path, m: Machine, msg: str) -> None:
    if gitutil.is_repo(repo) and gitutil.is_dirty(repo):
        gitutil.run(["add", "-A", "secrets"], repo)
        gitutil.commit(repo, msg, "cs", f"cs@{m.name}")
