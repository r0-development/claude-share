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

    s = sub.add_parser("init", help="set this machine up (first run: creates your config repo; later: --repo <url>)")
    s.add_argument("--repo", default="", help="existing config repo: git URL (or local path)")
    s.add_argument("--owner", default="", help="GitHub user/org to create claude-share-config under (first run)")
    s.add_argument("--non-interactive", action="store_true")
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

    s = sub.add_parser("new", help="create a brand-new project: dir, git, GitHub repo, first push, register, link")
    s.add_argument("name")
    s.add_argument("--identity", help="identity id (or use --<identity>/--<github-owner>, e.g. --personal, --work)")
    s.add_argument("--profiles", help="comma list (default: the identity id, e.g. personal)")
    s.add_argument("--description", "-d", default="")
    s.add_argument("--public", action="store_true", help="create the GitHub repo public (default private)")
    s.add_argument("--no-github", action="store_true", help="local git only; no remote")
    s.add_argument("--synced", action="store_true", help="kind=synced notes project (auto-committed)")

    s = sub.add_parser("token", help="GitHub API tokens per owner (local, never synced)")
    ts = s.add_subparsers(dest="token_cmd", metavar="<sub>")
    t = ts.add_parser("set", help="store a token (prompts, hidden input)"); t.add_argument("owner", help="GitHub user/org login")
    t = ts.add_parser("check", help="verify a token works"); t.add_argument("owner")
    t = ts.add_parser("rm", help="delete a stored token"); t.add_argument("owner")
    ts.add_parser("ls", help="list owners with a stored token")

    s = sub.add_parser("identity", help="git identities (who commits, which key, which GitHub owner)")
    isub = s.add_subparsers(dest="identity_cmd", metavar="<sub>")
    i = isub.add_parser("add", help="add an identity to projects.toml")
    i.add_argument("id", help="short id used as --<id> in cs new, e.g. personal, work")
    i.add_argument("--owner", required=True, help="GitHub user/org whose repos use this identity")
    i.add_argument("--name", required=True, help="git user.name")
    i.add_argument("--email", required=True, help="git user.email")
    i.add_argument("--key", help="ssh private key path (default ~/.ssh/id_ed25519_<id>)")
    i.add_argument("--gh-user", default="")
    i.add_argument("--no-token", action="store_true", help="don't prompt for a GitHub token")
    isub.add_parser("ls")

    sub.add_parser("self-update", help="git pull the cs tool itself")

    s = sub.add_parser("project", help="project helpers")
    ps = s.add_subparsers(dest="project_cmd", metavar="<sub>")
    ps.add_parser("id", help="print the project name for the cwd (empty if none)")
    return p


def _rewrite_identity_flags(argv: List[str]) -> List[str]:
    """`cs new foo --personal` -> `cs new foo --identity personal` (needs the manifest)."""
    if "new" not in argv:
        return argv
    try:
        _, _, man = _ctx()
    except SystemExit:
        return argv
    out: List[str] = []
    for a in argv:
        if a.startswith("--") and "=" not in a and a not in ("--identity", "--profiles", "--description", "--public",
                                                              "--no-github", "--synced", "--help", "--quiet"):
            ident = man.identity_by_flag(a[2:])
            if ident:
                out += ["--identity", ident.id]
                continue
        out.append(a)
    return out


def main(argv: Optional[List[str]] = None) -> int:
    platform.refuse_unsupported()
    argv = _rewrite_identity_flags(list(sys.argv[1:] if argv is None else argv))
    args = build_parser().parse_args(argv)
    ui.set_quiet(args.quiet)
    try:
        return dispatch(args)
    except KeyboardInterrupt:
        return 130


def dispatch(a) -> int:
    if a.cmd == "init":
        from . import configrepo
        return configrepo.init(a.repo, a.owner, a.name or "", _csv(a.profiles), _csv(a.skip), a.workspace,
                               interactive=not a.non_interactive and sys.stdin.isatty())
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
        from . import config
        if config.exists():
            repo, m, man = _ctx()
            from . import status
            status.run(repo, m, man)
            print()
            print(ui.dim("cs --help for commands"))
            return 0
        build_parser().print_help()
        return 0
    if a.cmd == "self-update":
        from . import gitutil
        root = paths.tool_root()
        if not gitutil.is_repo(root):
            ui.fail(f"{root} is not a git checkout"); return 1
        before = gitutil.out(["rev-parse", "--short", "HEAD"], root)
        p = gitutil.run(["pull", "-q", "--ff-only"], root, check=False, timeout=60)
        if p.returncode != 0:
            ui.fail(f"pull failed: {p.stderr.strip()}"); return 1
        after = gitutil.out(["rev-parse", "--short", "HEAD"], root)
        ui.ok(f"cs {__version__} at {after}" + ("" if before == after else f" (was {before})"))
        return 0
    if a.cmd == "token":
        from . import github
        if a.token_cmd == "set":
            f = github.set_token(a.owner)
            ui.ok(f"token stored in {paths.contract(f)} (0600, not synced)")
            return 0
        if a.token_cmd == "check":
            tok = github.get_token(a.owner)
            if not tok:
                ui.fail(f"no token for '{a.owner}'"); return 1
            try:
                ui.ok(f"token for '{a.owner}' authenticates as {github.whoami(tok)}"); return 0
            except github.GitHubError as e:
                ui.fail(str(e)); return 1
        if a.token_cmd == "rm":
            f = github.token_file(a.owner)
            if f.exists():
                f.unlink(); ui.ok("removed")
            return 0
        if a.token_cmd == "ls":
            d = github.token_file("x").parent
            for f in sorted(d.iterdir()) if d.exists() else []:
                print(f.name)
            return 0
        build_parser().parse_args(["token", "-h"])

    repo, m, man = _ctx()
    if a.cmd == "identity":
        from . import identity
        if a.identity_cmd == "add":
            return identity.add(repo, m, man, a.id, owner=a.owner, name=a.name, email=a.email, key=a.key,
                                gh_user=a.gh_user, no_token=a.no_token)
        identity.ls(man)
        return 0
    if a.cmd == "new":
        from . import newproj
        if not a.identity:
            flags = ", ".join(f"--{i}" for i in man.identities)
            raise SystemExit(f"cs: which identity? use one of {flags} (or --identity <id>)")
        ident = man.identities.get(a.identity) or man.identity_by_flag(a.identity)
        if not ident:
            raise SystemExit(f"cs: unknown identity '{a.identity}'")
        profiles = _csv(a.profiles) or ([ident.id] if ident.id in m.profiles else list(m.profiles))
        return newproj.run(repo, m, man, a.name, ident, profiles=profiles, description=a.description,
                           private=not a.public, no_github=a.no_github, kind="synced" if a.synced else "git")
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
