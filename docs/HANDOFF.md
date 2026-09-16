# Handoff: moving uncommitted work between machines

A handoff is a snapshot of one project's uncommitted work (and local-only commits) pushed to `wip/<user>/<branch>` on the
project's own remote; on another machine it turns back into uncommitted changes and the branch is deleted. Work code
never leaves its remote, and the snapshot is a plain git commit anyone can inspect.

`cs sync` does both directions in one run: every dirty project here is offered as a handoff to send, every handoff waiting
for this machine as one to apply — pre-checked on one plan screen with one confirmation. A branch with commits not yet
on its upstream gets its own row, unchecked: the handoff carries those commits regardless, and pushing the real branch
stays your decision per branch (nothing else in `cs` pushes one). Re-running `cs sync` on the same machine replaces your
own earlier handoff.

## The note
Every handoff carries one. `-m "…"` sets it. Otherwise headless `claude -p` reads a digest of the project's most recent
session transcript (what was said and which tools ran — never tool output) and writes where this stopped and what is
next, under a spinner with a time cap (`CS_NOTE_TIMEOUT` seconds, default 60, per handoff). No transcript, no `claude`
on PATH, offline, a failure or the cap → a git-derived note: branch, changed files, last commit subject, session end
time, and one line saying why there is no summary. Replacing your own earlier handoff: a note you typed with `-m` stays
unless `-m` gives a new one or a session newer than that handoff gets summarised by Claude; a generated note is always
regenerated. A worktree with sessions of its own is summarised from those. The summary run never becomes a session of
the project (`--no-session-persistence`).

```sh
# leaving machine A
cs sync -m "auth flow half done, tests red"        # plan screen: handoffs to send, pre-checked → Enter

# arriving on machine B
cs sync                                            # plan screen: handoffs to apply, pre-checked → Enter; note shown
claude                                             # the note is also the first thing Claude sees (SessionStart hook)
```

The manual halves stay callable (hidden): `cs handoff [-m note] [--all]`, `cs resume [--all]`, `cs handoffs [ls|gc|drop]`.

## What travels
- Tracked changes, untracked files, and local-only commits on the branch — `.gitignore` is respected.
- `handoff.extra = ["local.conf"]` in `projects.toml` force-adds gitignored paths that must follow you.
- Never: files matching the deny list (`**/.env*`, `*.pem`, `*.key`, `*token*`, `*secret*`, plus `handoff.never`);
  a match aborts with the path (`--allow <glob>` to override). Claude files don't need to travel — they are in the project state.
- `handoff.exclude = ["vendor/"]` skips paths even if dirty; `handoff = false` opts a project out.

## Guarantees
- The sending machine is never modified: the snapshot is built with a private index; your index, stash and working tree
  stay exactly as they were.
- One handoff per branch. A handoff from *another* machine that has not been resumed blocks a new one (`--overwrite`).
- `cs resume` refuses to overwrite local uncommitted changes; `--replace` keeps them in a backup ref
  (`refs/cs/backup/<branch>/<time>`) before applying the handoff.
- Worktree-layout projects: a handoff for a branch that isn't checked out gets its own `wt-<branch>` worktree.
- After resume the branch is deleted on the remote (`--keep-remote` to keep it). `cs handoffs` lists what's waiting;
  `cs handoffs gc --older-than 14` prunes forgotten handoffs.

## Reminders, no automation
Nothing is pushed to a project remote by itself (ADR-0002): hooks and the timer sync only the share. Bare `cs` fetches
every project (per-project time cap, offline tolerated; `--no-fetch` for scripts) and shows one line per project — dirty
changes, `↑` unpushed commits, `handoff waiting from <machine>`, `missing here` — plus the share's state and time since
its last sync, ending with `run: cs sync` when anything is pending (exit code 1). A dirty tree here plus a handoff from another machine waiting for the same branch is never decided by `cs sync`
alone: it asks, after the plan screen — *keep mine, leave the handoff waiting* (default; asked again next time) /
*apply the handoff* (your changes go to `refs/cs/backup/<branch>/<time>` first) / *send mine over it* (the waiting handoff
is kept in a backup ref here, then yours replaces it on the remote). Without a terminal the default is taken.
