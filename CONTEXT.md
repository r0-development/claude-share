# claude-share

A CLI (`cs`) that keeps a person's projects and Claude Code setup identical across their machines, so they can stop
working on one machine and continue on another.

## Language

**Share**:
The person's private git repo that holds their Claude Code setup, memory and every project's project state.
_Avoid_: config repo, share repo, store

**Machine**:
One enrolled device (home desktop, office desktop, laptop) that has run `cs init`. Identified by its machine name.
_Avoid_: device, host, box

**Project**:
A git checkout with a remote, listed in the share's manifest together with which machines get it. Every project is a
git repo with a remote; there are no other kinds.
_Avoid_: repo (ambiguous with the share), workspace, synced project, local project

**Profile**:
A tag on a project and on a machine; a machine gets the projects whose profiles intersect its own.
_Avoid_: group, tag, environment

**Identity**:
A git author (name, email) plus the GitHub owner and SSH key it commits as; chosen per project by the remote's owner.
_Avoid_: account, user, persona

**Project state**:
A project's Claude files (`CLAUDE.md`, `.claude/`, `.mcp.json`) and auto-memory, kept in the share and placed into
every checkout of the project without ever being committed to the project's own repo.
_Avoid_: side-store, Claude files, per-project config

**Handoff**:
A snapshot of one project's uncommitted work (and local-only commits) waiting on that project's remote for another
machine to pick up. One per branch.
_Avoid_: parcel, wip, wip branch, handoff branch

**Sync**:
The one daily action: bring this machine up to date with the share and the other machines, and leave nothing stale
here. Run on leaving and on arriving; it works out the direction itself.
_Avoid_: reconcile, push, pull, handoff (as a verb for the whole action)

**Import**:
Taking Claude files, memory or MCP servers that already exist on a machine into the share.
_Avoid_: adopt

**Remove**:
Taking a project out of the share: its manifest entry, project state and secrets go (the share's history keeps them).
Its checkouts and its remote are never touched; a checkout left behind is just a directory again.
_Avoid_: delete (ambiguous with deleting the checkout or the GitHub repo), forget, unregister

**Trust**:
Granting a machine access to the share's secrets. Only an already-trusted machine can do it.
_Avoid_: enroll

**Share key**:
A machine's SSH key that reaches only the share (deploy key). Nothing else uses it.
_Avoid_: master key

**Secrets**:
Encrypted values kept in the share and put into Claude's environment and project `.env` files.
_Avoid_: env, tokens (those are GitHub API tokens, local only)
