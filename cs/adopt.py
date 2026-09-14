"""`cs adopt`: pull state that already exists on this machine into the config repo.

  cs adopt memory <project>    ~/.claude/projects/<key>/memory/ -> side-store memory/
  cs adopt project <project>   existing CLAUDE.md/.claude/.mcp.json in the checkout -> side-store
  cs adopt mcp <project>       local-scope MCP servers from ~/.claude.json -> side-store .mcp.json (secrets -> ${VAR})
"""
from __future__ import annotations

import json
import re
import shutil
import time
from pathlib import Path
from typing import Dict, List

from . import gitutil, jsonmerge, paths
from .config import Machine
from .link import checkouts, memory_dir, side_store, sync_project
from .manifest import Manifest, Project
from .ui import act, info, ok, warn


def claude_project_key(p: Path) -> str:
    """Claude Code's ~/.claude/projects/<key> encoding of an absolute path."""
    return re.sub(r"[^A-Za-z0-9]", "-", str(p))


def candidate_paths(p: Project, ws: Path) -> List[Path]:
    c = [p.container(ws), p.checkout_root(ws)]
    c += checkouts(p, ws)
    seen, out = set(), []
    for x in c:
        r = x.resolve() if x.exists() else x
        if r not in seen:
            seen.add(r)
            out.append(r)
    return out


def union_lines(a: str, b: str) -> str:
    lines = a.splitlines()
    seen = set(lines)
    for l in b.splitlines():
        if l not in seen:
            lines.append(l)
            seen.add(l)
    return "\n".join(lines) + "\n"


def adopt_memory(repo: Path, p: Project, ws: Path, machine: str, check: bool = False) -> int:
    dest = memory_dir(repo, p)
    n = 0
    for cand in candidate_paths(p, ws):
        src = paths.claude_dir() / "projects" / claude_project_key(cand) / "memory"
        if not src.is_dir():
            continue
        info(f"{p.name}: adopting memory from {paths.contract(src)}")
        for f in sorted(src.rglob("*")):
            if not f.is_file():
                continue
            rel = f.relative_to(src)
            target = dest / rel
            if not target.exists():
                act(f"  + {rel}")
                if not check:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(f, target)
                n += 1
            elif target.read_bytes() == f.read_bytes():
                continue
            elif rel.name == "MEMORY.md":
                act(f"  ~ {rel} (union)")
                if not check:
                    target.write_text(union_lines(target.read_text(), f.read_text()))
                n += 1
            else:
                alt = target.with_name(f"{target.stem}.from-{machine}-{time.strftime('%Y%m%d')}{target.suffix}")
                act(f"  ? {rel} differs -> {alt.name}")
                if not check:
                    shutil.copy2(f, alt)
                n += 1
        if not check:
            marker = src.parent / "memory.adopted-by-cs"
            marker.write_text(f"adopted into {paths.contract(dest)} on {time.strftime('%Y-%m-%d')}\n")
    if n == 0:
        ok(f"{p.name}: no new memory to adopt")
    return n


def adopt_project_files(repo: Path, p: Project, ws: Path, check: bool = False) -> int:
    """Existing Claude files in the checkout(s) become the side-store's — plain
    two-way sync already does this (files missing in the side-store are adopted)."""
    changes = sync_project(repo, p, ws, check)
    for c in changes:
        act(f"{p.name}: {c}")
    if not changes:
        ok(f"{p.name}: nothing to adopt")
    return len(changes)


def _env_var_name(server: str, key: str) -> str:
    """foo-bar + FOO_BASE_URL -> FOO_BAR_BASE_URL; foo + FOO_ACCESS_TOKEN -> FOO_ACCESS_TOKEN."""
    st = [t for t in re.split(r"[^A-Za-z0-9]+", server.upper()) if t]
    kt = [t for t in re.split(r"[^A-Za-z0-9]+", key.upper()) if t]
    if st and kt and kt[0] == st[0]:
        kt = kt[1:]
    return "_".join(st + kt)


def adopt_mcp(repo: Path, p: Project, ws: Path, check: bool = False) -> int:
    cj = paths.claude_json()
    if not cj.exists():
        warn("no ~/.claude.json found")
        return 0
    data = json.loads(cj.read_text())
    projects = data.get("projects", {})
    found: Dict[str, dict] = {}
    for cand in candidate_paths(p, ws):
        entry = projects.get(str(cand)) or {}
        for name, cfg in (entry.get("mcpServers") or {}).items():
            found.setdefault(name, cfg)
    if not found:
        ok(f"{p.name}: no local-scope MCP servers in ~/.claude.json")
        return 0
    side = side_store(repo, p)
    mcp_file = side / ".mcp.json"
    existing = jsonmerge.loads(mcp_file.read_text()) if mcp_file.exists() else {"mcpServers": {}}
    servers = existing.setdefault("mcpServers", {})
    secrets: Dict[str, str] = {}
    for name, cfg in found.items():
        cfg = json.loads(json.dumps(cfg))
        for key in list((cfg.get("env") or {}).keys()):
            var = _env_var_name(name, key)
            secrets[var] = cfg["env"][key]
            cfg["env"][key] = "${" + var + "}"
        for key in list((cfg.get("headers") or {}).keys()):
            var = _env_var_name(name, key)
            secrets[var] = cfg["headers"][key]
            cfg["headers"][key] = "${" + var + "}"
        cfg.pop("oauth", None)
        if name in servers and servers[name] == cfg:
            continue
        act(f"{p.name}: .mcp.json <- {name} ({cfg.get('type', 'stdio')})")
        servers[name] = cfg
    if not check:
        side.mkdir(parents=True, exist_ok=True)
        mcp_file.write_text(jsonmerge.dumps(existing))
        sl = side / ".claude" / "settings.local.json"
        sd = jsonmerge.loads(sl.read_text()) if sl.exists() else {}
        sd["enabledMcpjsonServers"] = sorted(set(sd.get("enabledMcpjsonServers", [])) | set(servers))
        sl.parent.mkdir(parents=True, exist_ok=True)
        sl.write_text(jsonmerge.dumps(sd))
    if secrets:
        info("")
        warn(f"{p.name}: these values were replaced by ${{VAR}} placeholders — add them to your secrets store "
             f"(cs secrets edit) and remove the local-scope servers with `claude mcp remove <name> -s local`:")
        for k, v in secrets.items():
            masked = v[:4] + "…" + v[-2:] if len(v) > 8 else "…"
            info(f"  {k}={masked}   (full value: `cs adopt mcp {p.name} --show`)")
    return len(found)


def run(repo: Path, m: Machine, man: Manifest, what: str, names: List[str], check: bool, show: bool = False) -> None:
    ws = man.workspace(m)
    if not names:
        raise SystemExit("cs: adopt needs a project name (or --all)")
    for n in names:
        p = man.projects.get(n)
        if not p:
            raise SystemExit(f"cs: unknown project '{n}'")
        if what == "memory":
            adopt_memory(repo, p, ws, m.name, check)
        elif what == "project":
            adopt_project_files(repo, p, ws, check)
        elif what == "mcp":
            if show:
                _show_mcp_secrets(p, ws)
            else:
                adopt_mcp(repo, p, ws, check)
        else:
            raise SystemExit(f"cs: unknown adopt target '{what}' (memory|project|mcp)")


def _show_mcp_secrets(p: Project, ws: Path) -> None:
    data = json.loads(paths.claude_json().read_text())
    for cand in candidate_paths(p, ws):
        entry = data.get("projects", {}).get(str(cand)) or {}
        for name, cfg in (entry.get("mcpServers") or {}).items():
            for key, val in (cfg.get("env") or {}).items():
                print(f"{_env_var_name(name, key)}={val}")
            for key, val in (cfg.get("headers") or {}).items():
                print(f"{_env_var_name(name, key)}={val}")
