# Every project is a git repo with a remote

The manifest used to allow `kind = "synced"` (repos the tool commits for you) and `kind = "local"` (no remote). Both
were half-built and every code path had to special-case them, and they broke the promise that any machine can clone
everything. Decided 2026-09-16: there is one kind of project — a git checkout with a remote. `cs new` / `cs add`
always end with a remote (creating a private GitHub repo if needed); `cs doctor` flags a directory in the projects location without
one and `--fix` offers to create the GitHub repo. Existing `kind` values are ignored and can be deleted.

## Considered options

- Finish `synced` projects (auto-create remote, auto-commit on every sync). Rejected: the same outcome as an ordinary
  project plus a handoff, with a second code path to maintain.
