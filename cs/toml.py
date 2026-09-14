"""TOML reading (stdlib tomllib on 3.11+, tomli fallback) and a tiny writer.

The writer only handles the flat/simple shapes cs itself produces (machine.toml,
appended [projects.x] blocks). It is not a general TOML serializer.
"""
from __future__ import annotations

from typing import Any, Dict

try:  # Python 3.11+
    import tomllib as _toml
except ModuleNotFoundError:  # pragma: no cover
    try:
        import tomli as _toml  # type: ignore
    except ModuleNotFoundError:
        _toml = None  # type: ignore


def loads(text: str) -> Dict[str, Any]:
    if _toml is None:  # pragma: no cover
        raise SystemExit("cs: needs Python 3.11+ or `pip install tomli` for TOML parsing")
    return _toml.loads(text)


def load_file(path) -> Dict[str, Any]:
    with open(path, "rb") as f:
        return loads(f.read().decode("utf-8"))


def _fmt(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'
    if isinstance(value, (list, tuple)):
        return "[" + ", ".join(_fmt(v) for v in value) + "]"
    if isinstance(value, dict):
        return "{ " + ", ".join(f"{k} = {_fmt(v)}" for k, v in value.items()) + " }"
    raise TypeError(f"cannot serialize {type(value).__name__} to TOML")


def table(name: str, values: Dict[str, Any], comment: str = "") -> str:
    """Render one `[name]` table with scalar/array/inline-table values."""
    out = []
    if comment:
        out.append("# " + comment)
    if name:
        out.append(f"[{name}]")
    for k, v in values.items():
        if v is None:
            continue
        out.append(f"{k} = {_fmt(v)}")
    return "\n".join(out) + "\n"
