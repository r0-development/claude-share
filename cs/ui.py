"""Console output: colors, symbols, headings and aligned tables.

Everything degrades to plain text when stdout is not a tty or NO_COLOR is set.
"""
from __future__ import annotations

import os
import sys
from typing import Iterable, List, Optional, Sequence

_QUIET = False


def set_quiet(q: bool) -> None:
    global _QUIET
    _QUIET = q


def _tty() -> bool:
    return sys.stdout.isatty() and not os.environ.get("NO_COLOR")


def _c(code: str, s: str) -> str:
    return f"\033[{code}m{s}\033[0m" if _tty() else s


# palette
def bold(s: str) -> str: return _c("1", s)
def dim(s: str) -> str: return _c("2", s)
def green(s: str) -> str: return _c("32", s)
def yellow(s: str) -> str: return _c("33", s)
def red(s: str) -> str: return _c("31", s)
def cyan(s: str) -> str: return _c("36", s)
def blue(s: str) -> str: return _c("34", s)
def magenta(s: str) -> str: return _c("35", s)


OK, WARN, FAIL, ARROW, DOT = "✓", "!", "✗", "→", "•"


def info(msg: str) -> None:
    if not _QUIET:
        print(msg)


def act(msg: str) -> None:
    if not _QUIET:
        print(cyan(ARROW) + " " + msg)


def ok(msg: str) -> None:
    if not _QUIET:
        print(green(OK) + " " + msg)


def warn(msg: str) -> None:
    print(yellow(WARN) + " " + msg, file=sys.stderr)


def fail(msg: str) -> None:
    print(red(FAIL) + " " + msg, file=sys.stderr)


def head(msg: str) -> None:
    if not _QUIET:
        print(bold(msg))


def section(msg: str) -> None:
    if not _QUIET:
        print()
        print(bold(magenta("▸ ")) + bold(msg))


def kv(key: str, value: str, width: int = 14) -> None:
    if not _QUIET:
        print(f"  {dim(key.ljust(width))} {value}")


def _visible_len(s: str) -> int:
    out, i = 0, 0
    while i < len(s):
        if s[i] == "\033":
            j = s.find("m", i)
            i = j + 1 if j != -1 else len(s)
            continue
        out += 1
        i += 1
    return out


def table(rows: Sequence[Sequence[str]], header: Optional[Sequence[str]] = None, indent: int = 2) -> None:
    """Print aligned columns; cells may contain color codes."""
    if _QUIET or not rows:
        return
    all_rows: List[Sequence[str]] = ([header] if header else []) + list(rows)
    ncol = max(len(r) for r in all_rows)
    widths = [0] * ncol
    for r in all_rows:
        for i, c in enumerate(r):
            widths[i] = max(widths[i], _visible_len(c))
    pad = " " * indent

    def fmt(r: Sequence[str]) -> str:
        cells = []
        for i in range(ncol):
            c = r[i] if i < len(r) else ""
            cells.append(c + " " * (widths[i] - _visible_len(c)))
        return pad + "  ".join(cells).rstrip()

    if header:
        print(dim(fmt(header)))
    for r in rows:
        print(fmt(r))


def prompt(msg: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    try:
        v = input(f"{cyan('?')} {msg}{suffix}: ").strip()
    except EOFError:
        v = ""
    return v or default


def confirm(msg: str, default: bool = False) -> bool:
    d = "Y/n" if default else "y/N"
    try:
        v = input(f"{cyan('?')} {msg} [{d}]: ").strip().lower()
    except EOFError:
        return default
    if not v:
        return default
    return v in ("y", "yes")
