"""`cs link`: keep each project's Claude files in sync between the side-store
(<config-repo>/projects/<name>/) and every checkout of that project.

Files are COPIED (not symlinked) because Claude Code rewrites some of them.
Newer content wins in either direction; the side-store is the source of truth
for "which files exist". `autoMemoryDirectory` is injected into the checkout's
.claude/settings.local.json at copy time and stripped on the way back, so the
side-store stays machine-independent.
"""
from __future__ import annotations

import json
import os
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

from . import gitutil, jsonmerge, paths
from .config import Machine
from .manifest import Manifest, Project
from .ui import act, info, ok, warn

MANAGED_ROOT_FILES = ("CLAUDE.md", "CLAUDE.local.md", ".mcp.json")
MANAGED_DIR = ".claude"
SKIP_UNDER_CLAUDE = ("worktrees", "plans", "settings.json")   # never treated as side-store content
EXCLUDE_LINES = [".claude/", ".mcp.json", "CLAUDE.md", "CLAUDE.local.md"]
SETTINGS_LOCAL = ".claude/settings.local.json"
NOT_SYNCED_SIDE_DIRS = ("memory", "secrets")


def side_store(repo: Path, p: Project) -> Path:
    return repo / "projects" / p.name


def memory_dir(repo: Path, p: Project) -> Path:
    return side_store(repo, p) / "memory"


def checkouts(p: Project, ws: Path) -> List[Path]:
    """Every directory that should carry the project's Claude files."""
    root = p.checkout_root(ws)
    if not root.exists():
        return []
    if p.kind != "git" or not gitutil.is_repo(root):
        return [root]
    wts = gitutil.worktrees(root)
    return wts or [root]


def _managed_rel_files(base: Path) -> Set[str]:
    rels: Set[str] = set()
    for f in MANAGED_ROOT_FILES:
        if (base / f).is_file():
            rels.add(f)
    cdir = base / MANAGED_DIR
    if cdir.is_dir():
        for dp, dns, fns in os.walk(cdir):
            rel_dir = Path(dp).relative_to(base)
            if len(rel_dir.parts) >= 2 and rel_dir.parts[1] in SKIP_UNDER_CLAUDE:
                dns[:] = []
                continue
            for fn in fns:
                rel = str(rel_dir / fn)
                if rel == f"{MANAGED_DIR}/settings.json":
                    continue
                rels.add(rel)
    return rels


def _side_rel_files(side: Path) -> Set[str]:
    rels: Set[str] = set()
    if not side.is_dir():
        return rels
    for dp, dns, fns in os.walk(side):
        rel_dir = Path(dp).relative_to(side)
        if rel_dir.parts and rel_dir.parts[0] in NOT_SYNCED_SIDE_DIRS:
            dns[:] = []
            continue
        for fn in fns:
            rels.add(str(rel_dir / fn) if rel_dir.parts else fn)
    return rels


def _normalize(rel: str, data: bytes) -> bytes:
    """Content as it should look in the side-store (machine-independent)."""
    if rel == SETTINGS_LOCAL:
        try:
            d = json.loads(data.decode("utf-8") or "{}")
        except (ValueError, UnicodeDecodeError):
            return data
        d.pop("autoMemoryDirectory", None)
        return jsonmerge.dumps(d).encode("utf-8") if d else b""
    return data


def _localize(rel: str, data: bytes, mem_dir: Path) -> bytes:
    """Content as it should look inside a checkout on this machine."""
    if rel == SETTINGS_LOCAL:
        try:
            d = json.loads(data.decode("utf-8") or "{}") if data.strip() else {}
        except (ValueError, UnicodeDecodeError):
            d = {}
        d["autoMemoryDirectory"] = paths.contract(mem_dir)
        return jsonmerge.dumps(d).encode("utf-8")
    return data


def _state_file(p: Project) -> Path:
    return paths.state_dir() / "link" / f"{p.name}.json"


def _load_state(p: Project) -> Set[str]:
    f = _state_file(p)
    if f.exists():
        try:
            return set(json.loads(f.read_text()).get("files", []))
        except ValueError:
            pass
    return set()


def _save_state(p: Project, files: Set[str]) -> None:
    f = _state_file(p)
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps({"files": sorted(files)}, indent=2))


def _write(path: Path, data: bytes, mtime: Optional[float] = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".cs-tmp")
    tmp.write_bytes(data)
    if mtime is not None:
        os.utime(tmp, (mtime, mtime))
    os.replace(tmp, path)


def ensure_exclude(checkout: Path, check: bool, changes: List[str]) -> None:
    if not gitutil.is_repo(checkout) and not (checkout / ".git").is_file():
        return
    ex = gitutil.info_exclude(checkout)
    text = ex.read_text() if ex.exists() else ""
    lines = text.splitlines()
    missing = [l for l in EXCLUDE_LINES if l not in lines]
    if not missing:
        return
    changes.append(f"exclude {', '.join(missing)} in {paths.contract(checkout)}")
    if not check:
        ex.parent.mkdir(parents=True, exist_ok=True)
        block = "\n".join(missing) + "\n"
        ex.write_text(text + ("" if not text or text.endswith("\n") else "\n") + "# claude-share managed files\n" + block)


def sync_project(repo: Path, p: Project, ws: Path, check: bool = False) -> List[str]:
    """Two-way newer-wins sync for one project. Returns human-readable changes."""
    changes: List[str] = []
    side = side_store(repo, p)
    targets = checkouts(p, ws)
    if not targets:
        return changes
    mem = memory_dir(repo, p)
    if not mem.exists() and not check:
        mem.mkdir(parents=True, exist_ok=True)

    previously = _load_state(p)
    side_rels = _side_rel_files(side)
    all_rels: Set[str] = set(side_rels)
    for t in targets:
        all_rels |= _managed_rel_files(t)
    all_rels.add(SETTINGS_LOCAL)   # always exists in checkouts (memory redirect)

    final: Set[str] = set()
    for rel in sorted(all_rels):
        sp = side / rel
        side_exists = sp.is_file()
        side_data = _normalize(rel, sp.read_bytes()) if side_exists else None
        side_mtime = sp.stat().st_mtime if side_exists else -1.0

        # newest candidate among side-store and checkouts
        best_data, best_mtime, best_from = side_data, side_mtime, "side-store"
        for t in targets:
            tp = t / rel
            if tp.is_file():
                data = _normalize(rel, tp.read_bytes())
                mt = tp.stat().st_mtime
                if data != best_data and mt > best_mtime + 1e-6:
                    best_data, best_mtime, best_from = data, mt, paths.contract(t)

        deleted_in_side = (not side_exists) and rel in previously and rel != SETTINGS_LOCAL
        if deleted_in_side:
            for t in targets:
                tp = t / rel
                if tp.exists():
                    changes.append(f"remove {rel} from {paths.contract(t)} (deleted in side-store)")
                    if not check:
                        tp.unlink()
            continue

        if best_data is None:
            if rel == SETTINGS_LOCAL:
                best_data, best_mtime = b"", side_mtime
            else:
                continue

        # side-store gets the winner (settings.local.json only if non-empty)
        if best_data != side_data and (best_data or rel != SETTINGS_LOCAL):
            changes.append(f"side-store <- {rel} (from {best_from})")
            if not check:
                _write(sp, best_data, best_mtime if best_mtime > 0 else None)
        if best_data or rel != SETTINGS_LOCAL:
            final.add(rel)

        # every checkout gets the localized winner
        for t in targets:
            tp = t / rel
            want = _localize(rel, best_data, mem)
            have = tp.read_bytes() if tp.is_file() else None
            if have != want:
                changes.append(f"{paths.contract(t)}/{rel} <- side-store")
                if not check:
                    _write(tp, want, best_mtime if best_mtime > 0 else None)

    for t in targets:
        ensure_exclude(t, check, changes)
    if not check:
        _save_state(p, final)
    return changes


def run(repo: Path, m: Machine, man: Manifest, names: Optional[List[str]] = None, check: bool = False) -> int:
    ws = man.workspace(m)
    projects = [p for p in man.selected(m) if not names or p.name in names]
    if names:
        unknown = set(names) - {p.name for p in man.projects.values()}
        if unknown:
            raise SystemExit(f"cs: unknown project(s): {', '.join(sorted(unknown))}")
    total = 0
    for p in projects:
        if not checkouts(p, ws):
            continue
        changes = sync_project(repo, p, ws, check)
        for c in changes:
            (info if check else act)(f"{p.name}: {c}")
        total += len(changes)
    if total == 0:
        ok("project files in sync")
    return total
