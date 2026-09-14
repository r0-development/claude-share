"""`cs deps [--install]`: prerequisites per platform.

Linux/WSL2: user-local installs into ~/.local/bin (no sudo needed) for age, sops, fnm, claude;
            git/curl/gh come from apt (printed as a command if missing).
macOS:      Homebrew for everything except claude (native installer).
"""
from __future__ import annotations

import json
import os
import platform as _pyplatform
import shutil
import subprocess
import tarfile
import tempfile
import urllib.request
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

from . import paths, platform, ui

BIN = paths.home() / ".local" / "bin"


def _have(cmd: str) -> Optional[str]:
    return shutil.which(cmd) or (str(BIN / cmd) if (BIN / cmd).exists() else None)


def _ver(cmd: List[str]) -> str:
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=10).stdout.strip().splitlines()[0]
    except Exception:
        return ""


def _arch() -> str:
    m = _pyplatform.machine().lower()
    return "arm64" if m in ("arm64", "aarch64") else "amd64"


def _latest_tag(repo: str) -> str:
    req = urllib.request.Request(f"https://api.github.com/repos/{repo}/releases/latest", headers={"User-Agent": "claude-share"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())["tag_name"]


def _download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "claude-share"})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
        shutil.copyfileobj(r, f)


def _install_sops_linux() -> None:
    tag = _latest_tag("getsops/sops")
    BIN.mkdir(parents=True, exist_ok=True)
    _download(f"https://github.com/getsops/sops/releases/download/{tag}/sops-{tag}.linux.{_arch()}", BIN / "sops")
    (BIN / "sops").chmod(0o755)


def _install_age_linux() -> None:
    tag = _latest_tag("FiloSottile/age")
    BIN.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        tgz = Path(td) / "age.tgz"
        _download(f"https://github.com/FiloSottile/age/releases/download/{tag}/age-{tag}-linux-{_arch()}.tar.gz", tgz)
        with tarfile.open(tgz) as t:
            t.extractall(td)
        for name in ("age", "age-keygen"):
            shutil.copy2(Path(td) / "age" / name, BIN / name)
            (BIN / name).chmod(0o755)


def _sh(cmd: str) -> None:
    subprocess.run(cmd, shell=True, check=True)


def _brew(pkg: str) -> Callable[[], None]:
    return lambda: _sh(f"brew install {pkg}")


# name -> (check cmd, version cmd, linux installer, macos installer, required?)
def catalog() -> Dict[str, Tuple[str, List[str], Optional[Callable], Optional[Callable], bool]]:
    return {
        "git":   ("git", ["git", "--version"], None, _brew("git"), True),
        "curl":  ("curl", ["curl", "--version"], None, None, True),
        "ssh":   ("ssh", ["ssh", "-V"], None, None, True),
        "age":   ("age", ["age", "--version"], _install_age_linux, _brew("age"), True),
        "sops":  ("sops", ["sops", "--version"], _install_sops_linux, _brew("sops"), True),
        "fnm":   ("fnm", ["fnm", "--version"], lambda: _sh("curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell"), _brew("fnm"), False),
        "node":  ("node", ["node", "--version"], lambda: _sh(f"{_have('fnm') or '~/.local/share/fnm/fnm'} install 22 && {_have('fnm') or '~/.local/share/fnm/fnm'} default 22"), None, False),
        "gh":    ("gh", ["gh", "--version"], None, _brew("gh"), False),
        "claude": ("claude", ["claude", "--version"], lambda: _sh("curl -fsSL https://claude.ai/install.sh | bash"), lambda: _sh("curl -fsSL https://claude.ai/install.sh | bash"), True),
    }


def run(install: bool = False) -> int:
    rows = []
    missing_required = False
    apt_missing: List[str] = []
    for name, (cmd, vcmd, lin, mac, required) in catalog().items():
        path = _have(cmd)
        if path:
            rows.append([ui.green(ui.OK), name, ui.dim(_ver(vcmd)[:40])])
            continue
        if name == "fnm" and _have("node"):
            rows.append([ui.dim("-"), name, ui.dim("not needed (node present)")])
            continue
        installer = mac if platform.is_macos() else lin
        if install and installer:
            ui.act(f"installing {name}")
            try:
                installer()
                path = _have(cmd)
            except Exception as e:  # noqa: BLE001
                ui.warn(f"{name}: install failed: {e}")
        if path:
            rows.append([ui.green(ui.OK), name, ui.dim("installed")])
        else:
            if required:
                missing_required = True
            if not platform.is_macos() and name in ("git", "curl", "ssh", "gh"):
                apt_missing.append({"ssh": "openssh-client"}.get(name, name))
            rows.append([ui.red(ui.FAIL) if required else ui.yellow(ui.WARN), name, ui.dim("missing" + ("" if installer or apt_missing else ""))])
    ui.table(rows)
    if apt_missing:
        ui.info("  " + ui.bold("sudo apt install -y " + " ".join(apt_missing)))
    if not install and any(r[0] != ui.green(ui.OK) for r in rows):
        ui.info(ui.dim("  cs deps --install  installs the user-local ones (age, sops, fnm, node, claude)"))
    if str(BIN) not in os.environ.get("PATH", ""):
        ui.warn(f"{paths.contract(BIN)} is not on PATH (cs apply adds it to your shell rc)")
    return 1 if missing_required else 0
