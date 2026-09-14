# claude-share shell integration — sourced from ~/.bashrc / ~/.zshrc (managed block written by `cs apply`).
case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *) export PATH="$HOME/.local/bin:$PATH";; esac

# Launch Claude Code with decrypted secrets in its environment (so ${VAR} in .mcp.json resolve).
claude() {
  if command -v cs >/dev/null 2>&1 && [ -z "$CS_SECRETS_LOADED" ]; then
    cs -q secrets exec -- command claude "$@"
  else
    command claude "$@"
  fi
}

# A subshell with the current project's secrets exported (for IDEs launched from it, or manual use).
cs-shell() { cs -q secrets exec -- "${SHELL:-bash}" "$@"; }
