"""`cs apply`: render ~/.claude from the config repo's claude/ directory and
manage the git identity includes.

Linked (symlink):  CLAUDE.md, rules/, agents/, themes/, keybindings.json, skills/<name>/, plans/ (-> repo/plans)
Rendered (file):   settings.json  = settings.base.json (+) settings.<profile>.json... (+) settings.<machine>.json
Rendered (file):   ~/.config/git/claude-share.inc + identity-<id>.inc ; include line in ~/.gitconfig
"""
from __future__ import annotations

import json
import shutil
import time
from pathlib import Path
from typing import Dict, List, Tuple

from . import jsonmerge, paths
from .config import Machine
from .manifest import Manifest
from .ui import info, warn, ok, act

LINK_ITEMS = ["CLAUDE.md", "rules", "agents", "themes", "keybindings.json"]
GIT_INCLUDE_MARK = "# >>> claude-share >>>"
GIT_INCLUDE_END = "# <<< claude-share <<<"


def _backup(target: Path) -> Path:
    bdir = paths.state_dir() / "backups" / time.strftime("%Y%m%d-%H%M%S")
    bdir.mkdir(parents=True, exist_ok=True)
    dest = bdir / target.name
    shutil.move(str(target), str(dest))
    return dest


def _merge_dir_into(src_dir: Path, dst_dir: Path) -> None:
    """Move files from dst_dir into src_dir (existing files in src_dir win)."""
    for f in sorted(dst_dir.rglob("*")):
        if not f.is_file():
            continue
        rel = f.relative_to(dst_dir)
        t = src_dir / rel
        if not t.exists():
            t.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(f), str(t))
    shutil.rmtree(dst_dir)


def _link(src: Path, dst: Path, check: bool, changes: List[str]) -> None:
    """Make dst a symlink to src. A pre-existing real file/dir on the machine is
    adopted into the repo (dirs: merged, repo wins on collisions; files: moved
    if the repo has none, else backed up)."""
    if dst.is_symlink():
        if dst.resolve() == src.resolve():
            return
        changes.append(f"relink {paths.contract(dst)}")
        if not check:
            dst.unlink()
            dst.symlink_to(src)
        return
    if dst.exists():
        if dst.is_dir():
            changes.append(f"adopt {paths.contract(dst)} -> {paths.contract(src)} (merge)")
            if not check:
                src.mkdir(parents=True, exist_ok=True)
                _merge_dir_into(src, dst)
                dst.symlink_to(src)
        elif not src.exists():
            changes.append(f"adopt {paths.contract(dst)} -> {paths.contract(src)}")
            if not check:
                src.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(dst), str(src))
                dst.symlink_to(src)
        else:
            changes.append(f"replace {paths.contract(dst)} (backup kept)")
            if not check:
                _backup(dst)
                dst.symlink_to(src)
        return
    if not src.exists():
        return
    changes.append(f"link {paths.contract(dst)}")
    if not check:
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.symlink_to(src)


def settings_layers(repo: Path, m: Machine) -> List[Tuple[str, Dict]]:
    layers: List[Tuple[str, Dict]] = []
    names = ["settings.base.json"] + [f"settings.{p}.json" for p in m.profiles] + [f"settings.{m.name}.json"]
    for n in names:
        f = repo / "claude" / n
        if f.exists():
            layers.append((n, jsonmerge.loads(f.read_text())))
    return layers


def render_settings(repo: Path, m: Machine) -> Dict:
    return jsonmerge.merge_layers(*[d for _, d in settings_layers(repo, m)])


def apply_settings(repo: Path, m: Machine, check: bool, changes: List[str]) -> None:
    target = paths.claude_dir() / "settings.json"
    desired = render_settings(repo, m)
    if not settings_layers(repo, m):
        return
    current = jsonmerge.loads(target.read_text()) if target.exists() else {}
    if current == desired:
        return
    keys = jsonmerge.diff_keys(current, desired)
    changes.append(f"settings.json: {', '.join(keys[:8])}{' ...' if len(keys) > 8 else ''}")
    if not check:
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            _backup_copy(target)
        target.write_text(jsonmerge.dumps(desired))


def _backup_copy(target: Path) -> None:
    bdir = paths.state_dir() / "backups" / time.strftime("%Y%m%d-%H%M%S")
    bdir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(str(target), str(bdir / target.name))


def apply_links(repo: Path, check: bool, changes: List[str]) -> None:
    cdir = paths.claude_dir()
    cdir.mkdir(parents=True, exist_ok=True)
    for item in LINK_ITEMS:
        _link(repo / "claude" / item, cdir / item, check, changes)
    # skills: one link per skill dir so marketplace/plugin skills can coexist
    skills_src = repo / "claude" / "skills"
    if skills_src.is_dir():
        (cdir / "skills").mkdir(exist_ok=True)
        for s in sorted(skills_src.iterdir()):
            if s.is_dir():
                _link(s, cdir / "skills" / s.name, check, changes)
    # plans: whole dir
    _link(repo / "plans", cdir / "plans", check, changes)


def render_git_includes(man: Manifest) -> Dict[Path, str]:
    gdir = paths.home() / ".config" / "git"
    files: Dict[Path, str] = {}
    inc_lines = ["# generated by `cs apply` — do not edit; edit projects.toml [identities] instead"]
    for ident in man.identities.values():
        body = [
            f"# identity '{ident.id}' (generated by cs apply)",
            "[user]",
            f"\tname = {ident.name}",
            f"\temail = {ident.email}",
        ]
        if ident.ssh_key:
            key = paths.contract(paths.expand(ident.ssh_key))
            body += ["[core]", f"\tsshCommand = ssh -i {key} -o IdentitiesOnly=yes"]
        files[gdir / f"identity-{ident.id}.inc"] = "\n".join(body) + "\n"
        for g in ident.url_globs:
            inc_lines.append(f'[includeIf "hasconfig:remote.*.url:{g}"]')
            inc_lines.append(f"\tpath = identity-{ident.id}.inc")
    files[gdir / "claude-share.inc"] = "\n".join(inc_lines) + "\n"
    return files


def apply_git(man: Manifest, check: bool, changes: List[str]) -> None:
    for f, content in render_git_includes(man).items():
        if f.exists() and f.read_text() == content:
            continue
        changes.append(f"write {paths.contract(f)}")
        if not check:
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_text(content)
    gc = paths.home() / ".gitconfig"
    block = f"{GIT_INCLUDE_MARK}\n[include]\n\tpath = ~/.config/git/claude-share.inc\n{GIT_INCLUDE_END}\n"
    text = gc.read_text() if gc.exists() else ""
    if GIT_INCLUDE_MARK in text:
        start, end = text.index(GIT_INCLUDE_MARK), text.index(GIT_INCLUDE_END) + len(GIT_INCLUDE_END) + 1
        new = text[:start] + block + text[end:]
    else:
        new = text + ("\n" if text and not text.endswith("\n") else "") + block
    if new != text:
        changes.append("~/.gitconfig: include claude-share.inc")
        if not check:
            gc.write_text(new)


def run(repo: Path, m: Machine, man: Manifest, check: bool = False) -> List[str]:
    changes: List[str] = []
    apply_settings(repo, m, check, changes)
    apply_links(repo, check, changes)
    apply_git(man, check, changes)
    for c in changes:
        (info if check else act)(c)
    if not changes:
        ok("~/.claude up to date")
    return changes
