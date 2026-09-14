"""Deep merge for Claude Code settings layers, with stable serialization.

Rules: dicts merge recursively; lists are replaced by the overlay, except the
permission lists (`permissions.allow` / `permissions.deny` / `permissions.ask`)
and `enabledMcpjsonServers`, which are unioned (order preserved, base first).
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Tuple

UNION_PATHS = {
    ("permissions", "allow"),
    ("permissions", "deny"),
    ("permissions", "ask"),
    ("permissions", "additionalDirectories"),
    ("enabledMcpjsonServers",),
    ("disabledMcpjsonServers",),
}


def _union(a: List[Any], b: List[Any]) -> List[Any]:
    out = list(a)
    seen = {json.dumps(x, sort_keys=True) for x in a}
    for x in b:
        k = json.dumps(x, sort_keys=True)
        if k not in seen:
            out.append(x)
            seen.add(k)
    return out


def deep_merge(base: Any, overlay: Any, path: Tuple[str, ...] = ()) -> Any:
    if isinstance(base, dict) and isinstance(overlay, dict):
        out: Dict[str, Any] = dict(base)
        for k, v in overlay.items():
            out[k] = deep_merge(base.get(k), v, path + (k,)) if k in base else v
        return out
    if isinstance(base, list) and isinstance(overlay, list) and path in UNION_PATHS:
        return _union(base, overlay)
    return overlay


def merge_layers(*layers: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for layer in layers:
        if layer:
            out = deep_merge(out, layer)
    return out


def dumps(obj: Any) -> str:
    return json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=False) + "\n"


def loads(text: str) -> Any:
    return json.loads(text) if text.strip() else {}


def diff_keys(a: Dict[str, Any], b: Dict[str, Any], prefix: str = "") -> List[str]:
    """Dotted key paths where a and b differ (for `apply --check` output)."""
    out: List[str] = []
    for k in sorted(set(a) | set(b)):
        p = f"{prefix}.{k}" if prefix else k
        if k not in a or k not in b:
            out.append(p)
        elif isinstance(a[k], dict) and isinstance(b[k], dict):
            out.extend(diff_keys(a[k], b[k], p))
        elif a[k] != b[k]:
            out.append(p)
    return out
