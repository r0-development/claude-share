# Handoff: moving uncommitted work between machines

`cs handoff` snapshots the working tree of the project you are in and pushes it to `wip/<user>/<branch>` on the
project's own remote; `cs resume` on another machine turns it back into uncommitted changes and deletes the branch.
Work code never leaves its remote, and the snapshot is a plain git commit anyone can inspect.

```sh
# leaving machine A
cs handoff -m "auth flow half done, tests red"     # cwd project; --all for every selected project

# arriving on machine B
cs resume                                          # cwd project; --all for every project
claude                                             # the note is the first thing Claude sees (SessionStart hook)
```

## What travels
- Tracked changes, untracked files, and local-only commits on the branch — `.gitignore` is respected.
- `handoff.extra = ["local.conf"]` in `projects.toml` force-adds gitignored paths that must follow you.
- Never: files matching the deny list (`**/.env*`, `*.pem`, `*.key`, `*token*`, `*secret*`, plus `handoff.never`);
  a match aborts with the path (`--allow <glob>` to override). Claude files don't need to travel — they are in the side-store.
- `handoff.exclude = ["vendor/"]` skips paths even if dirty; `handoff = false` opts a project out.

## Guarantees
- The sending machine is never modified: the snapshot is built with a private index; your index, stash and working tree
  stay exactly as they were.
- One parcel per branch. A parcel from *another* machine that has not been resumed blocks a new one (`--overwrite`).
- `cs resume` refuses to overwrite local uncommitted changes; `--replace` keeps them in a backup ref
  (`refs/cs/backup/<branch>/<time>`) before applying the parcel.
- Worktree-layout projects: a parcel for a branch that isn't checked out gets its own `wt-<branch>` worktree.
- After resume the branch is deleted on the remote (`--keep-remote` to keep it). `cs wip` lists what's waiting;
  `cs wip gc --older-than 14` prunes forgotten parcels.

## Reminders, no automation
Nothing is pushed by itself. When a Claude session ends with uncommitted work, a local marker is written and `cs status`
shows `uncommitted work — cs handoff` for that project. `cs handoff` also runs `cs sync --push-only` so memory and plans
travel in the same gesture; `cs resume` pulls them first.
