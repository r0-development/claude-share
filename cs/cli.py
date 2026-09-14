"""argparse front-end: one subcommand -> one module."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import List, Optional

from . import __version__, paths, platform, ui


def _ctx():
    from . import config, manifest
    m = config.load()
    repo = m.repo_dir
    man = manifest.load(repo)
    return repo, m, man


def _csv(s: Optional[str]) -> List[str]:
    return [x.strip() for x in s.split(",") if x.strip()] if s else []


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="cs", description="claude-share: projects + Claude Code setup in sync across machines")
    p.add_argument("--version", action="version", version=f"cs {__version__}")
    p.add_argument("-q", "--quiet", action="store_true", help="only warnings/errors")
    sub = p.add_subparsers(dest="cmd", metavar="<command>")

    s = sub.add_parser("init", help="set this machine up from a config repo (re-runnable)")
    s.add_argument("--repo", required=True, help="config repo: git URL or local path")
    s.add_argument("--name", help="machine name (e.g. work-desktop)")
    s.add_argument("--profiles", help="comma list, e.g. work,personal")
    s.add_argument("--workspace", help="override workspace root for this machine")
    s.add_argument("--skip", default="", help="comma list of phases to skip: repo,apply,link,doctor")

    s = sub.add_parser("config", help="manage the config repo")
    cs_ = s.add_subparsers(dest="config_cmd", metavar="<sub>")
    n = cs_.add_parser("new", help="create a config repo skeleton")
    n.add_argument("path")
    n.add_argument("--force", action="store_true")
    cs_.add_parser("path", help="print the config repo path")

    s = sub.add_parser("apply", help="render ~/.claude and git identity includes from the config repo")
    s.add_argument("--check", action="store_true", help="report drift, change nothing (exit 1 on drift)")

    s = sub.add_parser("link", help="sync Claude files between side-store and project checkouts")
    s.add_argument("names", nargs="*")
    s.add_argument("--check", action="store_true")

    s = sub.add_parser("adopt", help="pull existing local state into the config repo")
    s.add_argument("what", choices=["memory", "project", "mcp"])
    s.add_argument("names", nargs="*")
    s.add_argument("--all", action="store_true", help="all selected projects")
    s.add_argument("--check", action="store_true")
    s.add_argument("--show", action="store_true", help="(mcp) print the secret values for your secrets store")

    s = sub.add_parser("sync", help="commit/pull/push the config repo (+ synced projects)")
    s.add_argument("--pull-only", action="store_true")
    s.add_argument("--push-only", action="store_true")
    s.add_argument("--timeout", type=int, default=20)
    s.add_argument("--resolve", choices=["ours", "theirs"])
    s.add_argument("--no-projects", action="store_true", help="skip kind=synced projects")

    s = sub.add_parser("status", help="config repo + projects overview")
    s.add_argument("--fetch", action="store_true")
    s.add_argument("--all", action="store_true", help="include projects not selected for this machine")

    s = sub.add_parser("doctor", help="environment and consistency checks")
    s.add_argument("--fix", action="store_true")

    s = sub.add_parser("add", help="register a project (default: cwd) in projects.toml")
    s.add_argument("path", nargs="?")
    s.add_argument("--kind", choices=["git", "synced", "local"])
    s.add_argument("--profiles", help="comma list (default: all)")
    s.add_argument("--identity")
    s.add_argument("--name")
    s.add_argument("--description", default="")
    s.add_argument("--no-commit", action="store_true")

    s = sub.add_parser("clone", help="clone selected projects that are missing on this machine")
    s.add_argument("names", nargs="*")
    s.add_argument("--dry-run", action="store_true")

    s = sub.add_parser("project", help="project helpers")
    ps = s.add_subparsers(dest="project_cmd", metavar="<sub>")
    ps.add_parser("id", help="print the project name for the cwd (empty if none)")
    return p


def main(argv: Optional[List[str]] = None) -> int:
    platform.refuse_unsupported()
    args = build_parser().parse_args(argv)
    ui.set_quiet(args.quiet)
    try:
        return dispatch(args)
    except KeyboardInterrupt:
        return 130


def dispatch(a) -> int:
    if a.cmd == "init":
        from . import configrepo
        return configrepo.init(a.repo, a.name or "", _csv(a.profiles), _csv(a.skip), a.workspace)
    if a.cmd == "config":
        from . import configrepo
        if a.config_cmd == "new":
            configrepo.new(paths.expand(a.path), a.force)
            return 0
        if a.config_cmd == "path":
            from . import config
            print(config.load().repo_dir)
            return 0
        build_parser().parse_args(["config", "-h"])
    if a.cmd is None:
        build_parser().print_help()
        return 0

    repo, m, man = _ctx()
    if a.cmd == "apply":
        from . import apply
        changes = apply.run(repo, m, man, check=a.check)
        return 1 if (a.check and changes) else 0
    if a.cmd == "link":
        from . import link
        n = link.run(repo, m, man, a.names, check=a.check)
        return 1 if (a.check and n) else 0
    if a.cmd == "adopt":
        from . import adopt
        names = a.names or ([p.name for p in man.selected(m)] if a.all else [])
        adopt.run(repo, m, man, a.what, names, a.check, a.show)
        return 0
    if a.cmd == "sync":
        from . import sync
        return sync.run(repo, m, man, pull_only=a.pull_only, push_only=a.push_only, timeout=a.timeout,
                        resolve=a.resolve, projects=not a.no_projects)
    if a.cmd == "status":
        from . import status
        return status.run(repo, m, man, fetch=a.fetch, show_all=a.all)
    if a.cmd == "doctor":
        from . import doctor
        return doctor.run(repo, m, man, do_fix=a.fix)
    if a.cmd == "add":
        from . import projects
        projects.add(repo, m, man, a.path, kind=a.kind, profiles=_csv(a.profiles), identity=a.identity,
                     name=a.name, description=a.description, no_commit=a.no_commit)
        return 0
    if a.cmd == "clone":
        from . import projects
        return projects.clone(repo, m, man, a.names, dry_run=a.dry_run)
    if a.cmd == "project":
        from . import projects
        if a.project_cmd == "id":
            pid = projects.project_id(m, man)
            if pid:
                print(pid)
            return 0 if pid else 1
    build_parser().print_help()
    return 2
