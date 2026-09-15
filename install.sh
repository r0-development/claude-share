#!/usr/bin/env bash
# claude-share one-line installer:
#   curl -fsSL https://raw.githubusercontent.com/r0-development/claude-share/master/install.sh | bash
# Installs the tool to ~/.local/share/claude-share, links ~/.local/bin/cs, then runs `cs init` (the wizard).
# Any arguments are passed to `cs init` (e.g. --repo <url> --name laptop --profiles personal --non-interactive).
set -euo pipefail

REPO="${CS_REPO:-https://github.com/r0-development/claude-share.git}"
BIN="$HOME/.local/bin"
# Re-use an existing checkout when ~/.local/bin/cs already points into one (developers keep theirs in the workspace).
if [ -z "${CS_HOME:-}" ] && [ -L "$BIN/cs" ]; then
  existing="$(cd "$(dirname "$(readlink -f "$BIN/cs")")/.." 2>/dev/null && pwd -P || true)"
  [ -n "$existing" ] && [ -d "$existing/.git" ] && [ -f "$existing/cs/cli.py" ] && CS_HOME="$existing"
fi
CS_HOME="${CS_HOME:-$HOME/.local/share/claude-share}"

need() { command -v "$1" >/dev/null 2>&1; }
missing=()
for t in git curl python3; do need "$t" || missing+=("$t"); done
if [ ${#missing[@]} -gt 0 ]; then
  echo "claude-share: missing ${missing[*]}" >&2
  if [ "$(uname)" = "Darwin" ]; then echo "  run: xcode-select --install   (provides git and python3)" >&2
  else echo "  run: sudo apt install -y ${missing[*]}" >&2; fi
  exit 1
fi
if ! python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)'; then
  echo "claude-share: python3 >= 3.9 required" >&2; exit 1
fi

if [ -d "$CS_HOME/.git" ]; then
  git -C "$CS_HOME" pull -q --ff-only || true
else
  git clone -q "$REPO" "$CS_HOME"
fi
mkdir -p "$BIN"
ln -sfn "$CS_HOME/bin/cs" "$BIN/cs"
case ":$PATH:" in *":$BIN:"*) ;; *) export PATH="$BIN:$PATH";; esac
echo "claude-share installed at $CS_HOME  (cs $("$BIN/cs" --version | awk '{print $2}'))"

# Re-attach the terminal: when piped through `curl | bash`, stdin is the pipe, and the wizard needs a tty.
if [ -t 0 ]; then
  exec "$BIN/cs" init --install-deps "$@"
elif [ -e /dev/tty ]; then
  exec "$BIN/cs" init --install-deps "$@" </dev/tty
else
  exec "$BIN/cs" init --install-deps --non-interactive "$@"
fi
