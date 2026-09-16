# Migrating a machine to the glossary names

Since the September 2026 redesign every on-disk name follows `CONTEXT.md`. A machine set up before that still reaches
its share (the old share checkout and share key are read as a fallback), but until `cs doctor --fix` runs, bare `cs`
says the share "never synced", the Stop hook's debounce is off, and the project-state bookkeeping starts empty. `cs doctor`
lists what is still old-named with its move; `cs doctor --fix` performs every move that is local and safe. Nothing here
touches a project remote by itself (ADR-0002).

## Before updating

Run `cs sync` on **both** machines so no handoff is waiting: handoffs sent by the old version live under `wip/…` on the
project remote, the new version looks under `handoff/…`. Then `cs update` on each machine, then `cs doctor --fix`.

## The moves

| what | old | new | `cs doctor --fix` |
|---|---|---|---|
| share key | `~/.ssh/cs/master` (+ `.pub`) | `~/.ssh/cs/share` (+ `.pub`) | renames both, re-pins the share's `core.sshCommand` |
| share checkout | `~/.config/claude-share/repo` | `~/.config/claude-share/share` | moves it, re-renders the `~/.claude` links and each checkout's `autoMemoryDirectory` |
| machine.toml | `repo = "…"` | `share = "…"` (omitted when it is the default) | rewrites the key |
| last sync marker | `~/.local/state/cs/last-config` | `~/.local/state/cs/last-sync` | renames |
| project-state bookkeeping | `~/.local/state/cs/link/` | `~/.local/state/cs/project-state/` | renames |
| locks and markers | `sync-config.lock`, `blocked-config`, `handoff/pending` | one `sync.lock` for every run; the others are gone | removes them |
| manifest keys | `kind = …`, `github_owner = …` | (dropped), `owner = …` | rewrites `projects.toml`; the next `cs sync` carries it |
| handoff refs | `wip/<user>/<branch>` on the project remote | `handoff/<user>/<branch>` | **by hand** — printed as the exact command |
| SessionEnd hook | `cs handoff --mark` | none (bare `cs` reads the trees) | `cs sync` re-installs the hooks without it |

Nothing in the share's own layout changed (`projects.toml`, `claude/`, `plans/`, `projects/<name>/`, `machines/<name>/`,
`secrets/`), so the two machines need not migrate at the same time.

## A handoff left under the old namespace

`cs doctor` asks each project remote (short time cap, offline tolerated) and shows `one: handoff wip/<user>/<branch>
on the remote` with the command that renames it there, for example:

```sh
git -C ~/dev/one fetch origin +refs/heads/wip/<user>/<branch>:refs/remotes/origin/wip/<user>/<branch>
git -C ~/dev/one push origin refs/remotes/origin/wip/<user>/<branch>:refs/heads/handoff/<user>/<branch> :refs/heads/wip/<user>/<branch>
git -C ~/dev/one update-ref -d refs/remotes/origin/wip/<user>/<branch>
```

Or apply it with the version that sent it before updating (`cs sync` there). A local `refs/heads/wip/…` is a handoff
that never reached the remote (the changes are still in the working tree): `git branch -D wip/<user>/<branch>`.

## The GitHub deploy key

The key's title on GitHub (`cs:<machine>:master`) is only a label; the key itself is unchanged by the rename. New
machines register theirs as `cs:<machine>:share-key`.
