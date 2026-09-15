#!/usr/bin/env bash
# claude-share one-line installer:
#   curl -fsSL https://raw.githubusercontent.com/r0-development/claude-share/master/install.sh | bash
# Installs prerequisites (git, curl, tar via apt on Debian/Ubuntu; Node 22 user-local from nodejs.org), the tool to
# ~/.local/share/claude-share, links ~/.local/bin/cs, then runs `cs init`. Arguments are passed to `cs init`.
set -euo pipefail

REPO="${CS_REPO:-https://github.com/r0-development/claude-share.git}"
BIN="$HOME/.local/bin"
NODE_DIR="$HOME/.local/share/claude-share-node"
need() { command -v "$1" >/dev/null 2>&1; }
say() { echo "claude-share: $*"; }

# ---- system prerequisites --------------------------------------------------------------------
missing=()
for t in git curl tar; do need "$t" || missing+=("$t"); done
if [ ${#missing[@]} -gt 0 ]; then
  if need apt-get; then
    say "installing ${missing[*]} with apt (sudo may ask for your password)"
    if ( : </dev/tty ) 2>/dev/null; then sudo apt-get update -qq && sudo apt-get install -y -qq "${missing[@]}" </dev/tty
    else sudo apt-get update -qq && sudo apt-get install -y -qq "${missing[@]}"; fi
  elif [ "$(uname)" = "Darwin" ]; then
    say "missing ${missing[*]} — run: xcode-select --install   then re-run this installer"; exit 1
  else
    say "missing ${missing[*]} — install them with your package manager, then re-run"; exit 1
  fi
fi

# ---- Node >= 18 (user-local tarball from nodejs.org when absent) ------------------------------
node_ok() { need node && [ "$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)" -ge 18 ]; }
if ! node_ok && [ -x "$NODE_DIR/bin/node" ]; then export PATH="$NODE_DIR/bin:$PATH"; fi
if ! node_ok; then
  os="$(uname | tr '[:upper:]' '[:lower:]')"; case "$(uname -m)" in arm64|aarch64) arch=arm64;; *) arch=x64;; esac
  ver="$(curl -fsSL https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt | grep -o "node-v22[0-9.]*-${os}-${arch}\.tar\.gz" | head -1)"
  [ -n "$ver" ] || { say "could not find a Node 22 build for ${os}-${arch}"; exit 1; }
  say "installing Node 22 (user-local, ${ver%.tar.gz})"
  tmp="$(mktemp -d)"; curl -fsSL "https://nodejs.org/dist/latest-v22.x/${ver}" -o "$tmp/node.tgz"
  rm -rf "$NODE_DIR"; mkdir -p "$NODE_DIR"; tar -xzf "$tmp/node.tgz" -C "$NODE_DIR" --strip-components=1; rm -rf "$tmp"
  mkdir -p "$BIN"; for b in node npm npx; do ln -sfn "$NODE_DIR/bin/$b" "$BIN/$b"; done
  export PATH="$NODE_DIR/bin:$PATH"
  node_ok || { say "Node install failed"; exit 1; }
fi

# ---- the tool --------------------------------------------------------------------------------
# Re-use an existing checkout when ~/.local/bin/cs already points into one (developers keep theirs in the workspace).
if [ -z "${CS_HOME:-}" ] && [ -L "$BIN/cs" ]; then
  existing="$(cd "$(dirname "$(readlink -f "$BIN/cs")")/.." 2>/dev/null && pwd -P || true)"
  [ -n "$existing" ] && [ -d "$existing/.git" ] && [ -f "$existing/package.json" ] && CS_HOME="$existing"
fi
CS_HOME="${CS_HOME:-$HOME/.local/share/claude-share}"
if [ -d "$CS_HOME/.git" ]; then git -C "$CS_HOME" pull -q --ff-only || true; else git clone -q "$REPO" "$CS_HOME"; fi
mkdir -p "$BIN"; ln -sfn "$CS_HOME/bin/cs" "$BIN/cs"
case ":$PATH:" in *":$BIN:"*) ;; *) export PATH="$BIN:$PATH";; esac
say "installed at $CS_HOME  (cs $("$BIN/cs" --version), node $(node --version))"

if [ -t 0 ]; then exec "$BIN/cs" init --install-deps "$@"
elif ( : </dev/tty ) 2>/dev/null; then exec "$BIN/cs" init --install-deps "$@" </dev/tty
else exec "$BIN/cs" init --install-deps --non-interactive "$@"; fi
