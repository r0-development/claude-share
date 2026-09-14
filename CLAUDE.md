# claude-share (`cs`) — conventions for working on this repo

- Python 3.9+ **stdlib only**. No pip dependencies. TOML in, tiny TOML writer for what cs itself emits.
- One subcommand → one module in `cs/`. `cli.py` only parses args and dispatches.
- Every filesystem path comes from `cs/paths.py` (HOME / CLAUDE_CONFIG_DIR / CS_CONFIG_DIR / XDG_STATE_HOME overridable) so
  `tests/run-local.sh` can run against a throwaway HOME.
- Never write machine-specific values (absolute paths, hostnames) into the config repo; inject them at link/apply time.
- Never touch a user's git index, stash, or working tree in project repos (`git add -A` only in the config repo and `kind=synced` repos).
- `cs sync` must never leave a repo mid-rebase: abort, write a `blocked-*` marker, print the resolve commands.
- Run `make test` (unit + e2e) before committing. The e2e script is the spec; extend it when behaviour changes.
- Design record lives in the (private) config repo under `docs/DESIGN.md`, not here.
