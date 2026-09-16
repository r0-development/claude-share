#!/usr/bin/env bash
# Refuse to commit plaintext under secrets/ in the claude-share share.
bad=0
while IFS= read -r f; do
  case "$f" in
    secrets/*.env|secrets/**/*.env)
      if ! git show ":$f" | grep -q '^sops_version='; then
        echo "pre-commit: $f is not sops-encrypted — refusing to commit plaintext secrets" >&2; bad=1
      fi;;
  esac
done < <(git diff --cached --name-only --diff-filter=AM)
exit $bad
