#!/usr/bin/env bash
# claude-share one-line installer:
#   curl -fsSL https://raw.githubusercontent.com/r0-development/claude-share/master/install.sh | bash
# Installs Node (via fnm) if missing, the tool to ~/.local/share/claude-share, links ~/.local/bin/cs, then runs `cs init`.
# Arguments are passed to `cs init` (e.g. --repo <url> --name laptop --profiles personal --non-interactive).
set -euo pipefail

REPO="${CS_REPO:-https://github.com/r0-development/claude-share.git}"
BIN="$HOME/.local/bin"
# Re-use an existing checkout when ~/.local/bin/cs already points into one (developers keep theirs in the workspace).
if [ -z "${CS_HOME:-}" ] && [ -L "$BIN/cs" ]; then
  existing="$(cd "$(dirname "$(readlink -f "$BIN/cs")")/.." 2>/dev/null && pwd -P || true)"
  [ -n "$existing" ] && [ -d "$existing/.git" ] && [ -f "$existing/package.json" ] && CS_HOME="$existing"
fi
CS_HOME="${CS_HOME:-$HOME/.local/share/claude-share}"

need() { command -v "$1" >/dev/null 2>&1; }
missing=()
for t in git curl; do need "$t" || missing+=("$t"); done
if [ ${#missing[@]} -gt 0 ]; then
  echo "claude-share: missing ${missing[*]}" >&2
  if [ "$(uname)" = "Darwin" ]; then echo "  run: xcode-select --install" >&2; else echo "  run: sudo apt install -y ${missing[*]}" >&2; fi
  exit 1
fi

# Node >= 18 (user-local via fnm when absent)
node_ok() { need node && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ]; }
if ! node_ok; then
  echo "claude-share: installing Node 22 via fnm (user-local)…"
  if ! need fnm && [ ! -x "$HOME/.local/share/fnm/fnm" ]; then
    if need unzip; then curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell >/dev/null
    else echo "  fnm needs 'unzip' (sudo apt install -y unzip) — or install Node 18+ yourself, then re-run" >&2; exit 1; fi
  fi
  FNM="$(command -v fnm || echo "$HOME/.local/share/fnm/fnm")"
  eval "$("$FNM" env --shell bash)"
  "$FNM" install 22 >/dev/null && "$FNM" default 22 >/dev/null
  node_ok || { echo "claude-share: Node install failed" >&2; exit 1; }
fi

if [ -d "$CS_HOME/.git" ]; then git -C "$CS_HOME" pull -q --ff-only || true; else git clone -q "$REPO" "$CS_HOME"; fi
mkdir -p "$BIN"; ln -sfn "$CS_HOME/bin/cs" "$BIN/cs"
case ":$PATH:" in *":$BIN:"*) ;; *) export PATH="$BIN:$PATH";; esac
echo "claude-share installed at $CS_HOME  (cs $("$BIN/cs" --version))"

if [ -t 0 ]; then exec "$BIN/cs" init --install-deps "$@"
elif [ -e /dev/tty ]; then exec "$BIN/cs" init --install-deps "$@" </dev/tty
else exec "$BIN/cs" init --install-deps --non-interactive "$@"; fi
