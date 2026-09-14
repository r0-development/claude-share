"""Console output helpers (no color when not a tty)."""
from __future__ import annotations

import os
import sys

_QUIET = False


def set_quiet(q: bool) -> None:
    global _QUIET
    _QUIET = q


def _c(code: str, s: str) -> str:
    if not sys.stdout.isatty() or os.environ.get("NO_COLOR"):
        return s
    return f"\033[{code}m{s}\033[0m"


def info(msg: str) -> None:
    if not _QUIET:
        print(msg)


def act(msg: str) -> None:
    if not _QUIET:
        print(_c("36", "→ ") + msg)


def ok(msg: str) -> None:
    if not _QUIET:
        print(_c("32", "✓ ") + msg)


def warn(msg: str) -> None:
    print(_c("33", "! ") + msg, file=sys.stderr)


def fail(msg: str) -> None:
    print(_c("31", "✗ ") + msg, file=sys.stderr)


def head(msg: str) -> None:
    if not _QUIET:
        print(_c("1", msg))
