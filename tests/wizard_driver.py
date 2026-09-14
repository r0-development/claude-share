"""Drive `cs init` wizard with scripted answers (used by run-local.sh).

Answers are consumed in order by whichever prompt asks next:
  select  -> value or label prefix ("<default>" keeps the default)
  confirm -> y / n
  prompt  -> text ("<default>" keeps the default)
  wait    -> "" or the skip key
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from cs import configrepo, ui  # noqa: E402

answers = iter(sys.argv[2:])


def _next(default):
    a = next(answers, "<default>")
    return default if a == "<default>" else a


def prompt(msg, default="", validate=None, placeholder=""):
    v = _next(default)
    err = validate(v) if validate else None
    if err:
        raise SystemExit(f"driver: '{v}' rejected for '{msg}': {err}")
    print(f"? {msg} -> {v}")
    return v


def confirm(msg, default=False):
    a = _next("y" if default else "n")
    print(f"? {msg} -> {a}")
    return a == "y"


def select(msg, options, default=0):
    a = _next(options[default][0])
    for v, label in options:
        if a == v or label.lower().startswith(a.lower()):
            print(f"? {msg} -> {v}")
            return v
    raise SystemExit(f"driver: no option '{a}' for '{msg}'")


def wait_enter(msg, skip_key=""):
    a = _next("")
    print(f"? {msg} -> {a!r}")
    return a


ui.prompt, ui.confirm, ui.select, ui.wait_enter = prompt, confirm, select, wait_enter
ui.password = lambda msg: _next("")
sys.exit(configrepo.wizard(install_deps=False, skip=["deps", "hooks", "doctor"], repo_url=sys.argv[1] if sys.argv[1] != "-" else ""))
