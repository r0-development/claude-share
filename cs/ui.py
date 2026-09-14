"""Console UI: clack-style prompts (select / confirm / text / note / spinner), rails, tables, messages.

Stdlib only. Degrades gracefully: no TTY -> plain line prompts and defaults; NO_COLOR -> no colors.
Every symbol is accompanied by a word so output stays grep-able.
"""
from __future__ import annotations

import os
import re
import sys
import threading
import time
from contextlib import contextmanager
from typing import Callable, Iterator, List, Optional, Sequence, Tuple

_QUIET = False


def set_quiet(q: bool) -> None:
    global _QUIET
    _QUIET = q


def is_tty() -> bool:
    return sys.stdin.isatty() and sys.stdout.isatty()


def _color_on() -> bool:
    return sys.stdout.isatty() and not os.environ.get("NO_COLOR")


def _c(code: str, s: str) -> str:
    return f"\033[{code}m{s}\033[0m" if _color_on() else s


def bold(s: str) -> str: return _c("1", s)
def dim(s: str) -> str: return _c("2", s)
def green(s: str) -> str: return _c("32", s)
def yellow(s: str) -> str: return _c("33", s)
def red(s: str) -> str: return _c("31", s)
def cyan(s: str) -> str: return _c("36", s)
def blue(s: str) -> str: return _c("34", s)
def magenta(s: str) -> str: return _c("35", s)
def gray(s: str) -> str: return _c("90", s)


OK, WARN, FAIL, ARROW, DOT = "✓", "!", "✗", "→", "•"
BAR = "│"


def _visible_len(s: str) -> int:
    return len(re.sub(r"\033\[[0-9;]*m", "", s))


# ---------------------------------------------------------------- plain messages
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


def error(what: str, why: str = "", fix: str = "") -> None:
    """Three-line error: what happened · why · how to fix."""
    print(red(FAIL) + " " + bold(what), file=sys.stderr)
    if why:
        print("  " + why, file=sys.stderr)
    if fix:
        print("  " + cyan(ARROW) + " " + fix, file=sys.stderr)


def head(msg: str) -> None:
    if not _QUIET:
        print(bold(msg))


def section(msg: str) -> None:
    if not _QUIET:
        print()
        print(gray(BAR))
        print(gray("◆") + "  " + bold(msg))


def kv(key: str, value: str, width: int = 14) -> None:
    if not _QUIET:
        print(f"{gray(BAR)}  {dim(key.ljust(width))} {value}")


def table(rows: Sequence[Sequence[str]], header: Optional[Sequence[str]] = None, indent: int = 2) -> None:
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
        cells = [(r[i] if i < len(r) else "") + " " * (widths[i] - _visible_len(r[i] if i < len(r) else "")) for i in range(ncol)]
        return pad + "  ".join(cells).rstrip()

    if header:
        print(dim(fmt(header)))
    for r in rows:
        print(fmt(r))


# ---------------------------------------------------------------- rails (clack style)
def intro(title: str) -> None:
    if not _QUIET:
        print()
        print(gray("┌") + "  " + bold(title))
        print(gray(BAR))


def outro(msg: str) -> None:
    if not _QUIET:
        print(gray("└") + "  " + msg)
        print()


def step(msg: str, state: str = "ok") -> None:
    """A completed/informational step on the rail."""
    if _QUIET:
        return
    sym = {"ok": green("◇"), "warn": yellow("▲"), "fail": red("■"), "info": gray("◇"), "skip": gray("○")}[state]
    print(f"{sym}  {msg}")
    print(gray(BAR))


def note(title: str, lines: Sequence[str], state: str = "info") -> None:
    """Bordered box for things the user must read or copy (keys, URLs)."""
    if _QUIET:
        return
    sym = {"info": cyan("▲"), "warn": yellow("▲")}[state]
    print(f"{sym}  {bold(title)}")
    for l in lines:
        print(f"{gray(BAR)}  {l}")
    print(gray(BAR))


# ---------------------------------------------------------------- raw key input
def _read_key() -> str:
    import termios
    import tty
    fd = sys.stdin.fileno()
    old = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = sys.stdin.read(1)
        if ch == "\x1b":
            ch2 = sys.stdin.read(1)
            if ch2 == "[":
                ch3 = sys.stdin.read(1)
                return {"A": "up", "B": "down", "C": "right", "D": "left"}.get(ch3, "esc")
            return "esc"
        return {"\r": "enter", "\n": "enter", "\x03": "ctrl-c", "\x04": "ctrl-d", "\x7f": "backspace", " ": "space", "\t": "tab"}.get(ch, ch)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old)


def _hide_cursor() -> None:
    sys.stdout.write("\033[?25l"); sys.stdout.flush()


def _show_cursor() -> None:
    sys.stdout.write("\033[?25h"); sys.stdout.flush()


def _clear_lines(n: int) -> None:
    if n:
        sys.stdout.write(f"\033[{n}A\r\033[J"); sys.stdout.flush()


# ---------------------------------------------------------------- prompts
def select(message: str, options: Sequence[Tuple[str, str]], default: int = 0) -> str:
    """options: [(value, label)]. Returns the value. Arrow/j/k/number keys + Enter."""
    values = [v for v, _ in options]
    if not is_tty():
        print(f"? {message}")
        for i, (v, label) in enumerate(options, 1):
            print(f"  {i}) {label}")
        raw = input(f"  choose [{default + 1}]: ").strip()
        if raw.isdigit() and 1 <= int(raw) <= len(options):
            return values[int(raw) - 1]
        return values[default]
    idx = default
    print(f"{cyan('◆')}  {bold(message)}")
    drawn = 0
    _hide_cursor()
    try:
        while True:
            _clear_lines(drawn)
            for i, (v, label) in enumerate(options):
                marker = green("●") if i == idx else gray("○")
                text = label if i == idx else dim(label)
                print(f"{gray(BAR)}  {marker} {text}")
            drawn = len(options)
            k = _read_key()
            if k in ("up", "k"):
                idx = (idx - 1) % len(options)
            elif k in ("down", "j", "tab"):
                idx = (idx + 1) % len(options)
            elif k.isdigit() and 1 <= int(k) <= len(options):
                idx = int(k) - 1
            elif k == "enter":
                break
            elif k in ("ctrl-c", "esc"):
                _show_cursor(); print(); raise KeyboardInterrupt
    finally:
        _show_cursor()
    _clear_lines(drawn + 1)
    print(f"{green('◇')}  {message}")
    print(f"{gray(BAR)}  {dim(options[idx][1])}")
    print(gray(BAR))
    return values[idx]


def confirm(message: str, default: bool = False) -> bool:
    if not is_tty():
        d = "Y/n" if default else "y/N"
        try:
            v = input(f"? {message} [{d}]: ").strip().lower()
        except EOFError:
            return default
        return default if not v else v in ("y", "yes")
    val = select(message, [("yes", "Yes"), ("no", "No")], 0 if default else 1)
    return val == "yes"


def prompt(message: str, default: str = "", validate: Optional[Callable[[str], Optional[str]]] = None,
           placeholder: str = "") -> str:
    """Text input. `validate` returns an error string or None; the question is re-asked in place."""
    if not is_tty():
        suffix = f" [{default}]" if default else ""
        while True:
            try:
                v = input(f"? {message}{suffix}: ").strip() or default
            except EOFError:
                v = default
            err = validate(v) if validate else None
            if not err:
                return v
            print(f"  {WARN} {err}")
    err_line = ""
    while True:
        print(f"{cyan('◆')}  {bold(message)}")
        hint = dim(f"({default})") if default else (dim(placeholder) if placeholder else "")
        if err_line:
            print(f"{gray(BAR)}  {yellow(WARN + ' ' + err_line)}")
        sys.stdout.write(f"{gray(BAR)}  {hint + ' ' if hint else ''}")
        sys.stdout.flush()
        try:
            v = input().strip() or default
        except EOFError:
            v = default
        err = validate(v) if validate else None
        lines = 3 if err_line else 2
        _clear_lines(lines)
        if not err:
            print(f"{green('◇')}  {message}")
            print(f"{gray(BAR)}  {dim(v) if v else dim('(empty)')}")
            print(gray(BAR))
            return v
        err_line = err


def password(message: str) -> str:
    import getpass
    if is_tty():
        print(f"{cyan('◆')}  {bold(message)}")
        v = getpass.getpass(f"{gray(BAR)}  ")
        _clear_lines(2)
        print(f"{green('◇')}  {message}")
        print(f"{gray(BAR)}  {dim('••••••••' if v else '(empty)')}")
        print(gray(BAR))
        return v
    return getpass.getpass(f"? {message}: ")


def wait_enter(message: str, skip_key: str = "") -> str:
    """Pause until Enter. Returns '' or the skip key if typed."""
    hint = f"  {dim('(' + skip_key + ' to skip)')}" if skip_key else ""
    if not is_tty():
        try:
            return input(f"? {message} [Enter]{hint}: ").strip()
        except EOFError:
            return skip_key
    print(f"{cyan('◆')}  {bold(message)}{hint}")
    sys.stdout.write(f"{gray(BAR)}  "); sys.stdout.flush()
    try:
        v = input().strip()
    except EOFError:
        v = skip_key
    _clear_lines(2)
    return v


# ---------------------------------------------------------------- spinner
_FRAMES = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"


@contextmanager
def spinner(label: str) -> Iterator[Callable[[str], None]]:
    """with ui.spinner("cloning…") as update: ...; update("new label")"""
    if _QUIET or not sys.stdout.isatty():
        if not _QUIET:
            print(f"{gray(BAR)}  {label}")
        yield lambda s: None
        return
    state = {"label": label, "stop": False}

    def run() -> None:
        i = 0
        while not state["stop"]:
            sys.stdout.write(f"\r{cyan(_FRAMES[i % len(_FRAMES)])}  {state['label']}\033[K")
            sys.stdout.flush()
            time.sleep(0.08)
            i += 1

    t = threading.Thread(target=run, daemon=True)
    _hide_cursor()
    t.start()
    try:
        yield lambda s: state.update(label=s)
    finally:
        state["stop"] = True
        t.join()
        sys.stdout.write("\r\033[K")
        _show_cursor()
