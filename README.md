# claude-share (`cs`)

Your projects and your Claude Code setup, identical on every machine. Stop working on one machine, continue on
another: uncommitted work, Claude's memory, `.env` files, settings, skills — all of it arrives.

Two things to remember:

```sh
cs          # what is waiting for me, what is stale here
cs sync     # run when leaving and when arriving: handoffs, pushes, .env files, the share
```

Everything else is occasional (`cs new`, `cs add`, `cs secrets`, `cs trust`), setup (`cs init`), or health (`cs doctor`).
Vocabulary: `CONTEXT.md`. Setting a machine up: `docs/BOOTSTRAP.md`.

## The daily loop

### `cs` — what is waiting, what is stale

Bare `cs` fetches the share and every project (short time cap per remote, offline tolerated) and prints one line each:

```
claude-share  desk
│  profiles personal, acme  workspace ~/dev
│
│  project      branch   state
│  share        master   synced 4 min ago
│  billing-api  feat/x   3 dirty  ↑2 unpushed  cs sync
│  notes        master   handoff waiting from laptop (2 h ago)  cs sync
│  site         master   .env: take 1 key from laptop  cs sync
│  tool         master   .env.local: 1 key to fill in (API_URL)
│  docs         master   clean
│
└  run: cs sync
```

A project's line shows dirty changes, `↑N unpushed` commits, `handoff waiting from <machine>`, what its `.env` files
would move, `missing here` — and `cs sync` after it when that run would do or ask something there. The share's line shows
its own state and when it last synced. Directories under the projects location that no project claims are listed with
the `cs add` command that registers them. The last line is the command that resolves what was found: `run: cs sync`
when anything is pending, `run: cs doctor --fix` when only repairs are; the exit code is 1 in both cases (`cs --no-fetch`
for scripts and prompts).

### `cs sync` — leaving and arriving with one verb

```sh
cs sync                          # on leaving and on arriving; it works out the direction itself
cs sync -m "auth flow half done"  # sets the note carried by the handoffs sent
```

One run, in this order:

1. **The share** is synced: commit → pull --rebase → push. Memory and plan files that changed on both machines are
   union-merged; any other file changed on both machines is asked, per file (this machine's version / the other
   machine's, newest offered first), and the rebase finishes in the same run. The share is never left mid-rebase.
2. **Repairs**, without asking: `~/.claude` (settings, links), git identity includes, the shell rc block, the Claude Code
   hooks and the 15-minute timer, and the project state placed into every checkout and worktree.
3. **Projects missing here** are cloned.
4. **Projects are checked** — every checkout and worktree, every waiting handoff, every `.env` file — and one **plan
   screen** appears:

   ```
   What should cs sync do?
   ◻ handoffs to send
     ◼ billing-api · feat/x     3 changes, 2 unpushed commits
   ◻ handoffs to apply
     ◼ notes · master           from laptop, 2 h ago — Stopped: outline done. Next: fill in section 3.
   ◻ branches to push
     ◻ billing-api · feat/x     2 unpushed commits → upstream
   ◻ .env files to store or update
     ◼ site · .env              take 1 key from laptop
   ```

   Handoffs to send (dirty work here), handoffs to apply (work waiting for this machine) and `.env` files with
   something to move are pre-checked; branches with unpushed commits are listed **unchecked** — the handoff carries
   those commits either way, and pushing a real branch stays your decision, made only on this screen. One
   confirmation. An empty plan skips the screen (`nothing to move — no handoffs waiting, nothing stale here`).
5. **Execute**: handoffs sent, handoffs applied (the note is shown), `.env` files merged, ticked branches pushed.
6. **The share** is pushed again with what the run changed (project state, memory, notes), and a one-line summary
   closes the run: `1 handoff(s) sent · 1 .env file(s) merged`.

Nothing is written to a project remote before the plan screen (ADR-0002). Offline, the local parts still run and the
share's changes wait for the next sync. A second `cs sync` on the same machine replaces your own earlier handoff.

**A handoff** is a snapshot of one project's uncommitted work and local-only commits, pushed to
`handoff/<user>/<branch>` on the project's own remote — one per branch — and turned back into uncommitted changes
where it is applied. The sending machine is never touched (a private index builds it); files that look secret
(`.env*`, `*.pem`, `*.key`, `*token*`, `*secret*`) are refused; a worktree is created on demand for a branch that is
not checked out. **Every handoff carries a note**: `-m` sets it; otherwise headless `claude` writes "where this stopped,
what is next" from the project's latest session transcript (under a spinner, capped at `CS_NOTE_TIMEOUT` seconds,
60 by default); with no transcript, no `claude` on PATH, no network, a failure or the cap, the note is derived from git
(branch, changed files, last commit, session end time, and why there is no summary). The note is shown when the
handoff is applied and again at the next Claude Code session start there. A dirty checkout with a handoff waiting for
the same branch is asked after the plan screen: keep mine and leave it waiting (default) / apply the handoff / send
mine over it — the losing side goes to `refs/cs/backup/<branch>/<time>` in that checkout, never away.
Details: `docs/HANDOFF.md`.

**`.env` files** travel through the share, never through a handoff. Every gitignored `.env`, `.env.production`, … at a
project's root is one encrypted entry in the share's secrets area. Values merge **per key** against the snapshot of
the last sync, so a key changed on the other machine is never lost and the local file is patched in place (comments
and order kept); only a key changed on both machines since the last sync is asked, per key (no terminal: newest wins).
Gitignored `.env.local` / `.env.*.local` travel **keys only**, without a row: a key new on the other machine arrives
with the `.env.example` value or empty, an existing value is never touched, and `cs` says
`.env.local: 1 key to fill in (KEY)` until it is. Files git tracks are git's business; an untracked `.env` git would
commit is refused until it is gitignored. Details: `docs/SECRETS.md`.

### What runs by itself

The Claude Code hooks push the share after a response (at most every two minutes) and pull it at session start (and print a waiting note);
a timer syncs the share every 15 minutes. That is the share only — nothing touches a project remote unattended.
`cs sync` re-installs both when they are missing.

## Projects

Every project is a git checkout with a remote, listed in the share's `projects.toml` together with which machines get
it, and living at `~/dev/<name>` (the projects location is chosen at `cs init`; same layout on every machine).

```sh
cs new billing-api --acme            # dir, git init -b master, private GitHub repo under the identity's owner, first push, registered, Claude wired in
cs add ~/dev/existing                # register a directory; creates its private GitHub repo when it has no remote
cd ~/dev/thing && cs add             # default: the current directory (url, branch, identity, worktree layout inferred)
cs clone                             # on a new machine (cs sync does this too)
cs remove old-thing                  # out of the share: manifest entry, project state, secrets — one commit, after one confirmation
```

`cs new` takes `--<identity>` (or `--<github-owner>`), `--profiles a,b`, `-d "description"`, `--public`; `cs add` takes
`--identity`, `--profiles`, `--description`, `--public`, `--name`, `--no-commit`. Both are re-runnable. In `projects.toml`, `profiles` decides which machines get a
project (a machine gets the projects whose profiles intersect its own), `machines = [...]` is a hard allowlist,
`layout = "worktrees"` marks a `<name>/repo` clone with sibling worktrees, `handoff = false` / `env = false` opt a
project out of handoffs / `.env` travel, `handoff.extra`, `handoff.exclude`, `handoff.never` and `env.local` tune what
travels (`docs/HANDOFF.md`, `docs/SECRETS.md`).

`cs remove` never touches a checkout, a worktree or the GitHub repo: the checkout is just a directory again (the only thing
tidied inside it, on every machine at its next `cs sync`, is the auto-memory pointer `cs` wrote there), and the closing
line names the `gh repo delete` command for when the remote should go too. `--yes` skips the confirmation, `--no-commit`
leaves the share commit to you; undo is `git revert` of that commit in the share. `cs` and `cs doctor` offer `cs remove`
for a project that has no remote and is not on this machine, and `cs doctor` flags state or secrets left in the share
for a name no longer registered.

**Project state** — a project's `CLAUDE.md`, `.claude/**`, `.mcp.json` and auto-memory — lives in the share under
`projects/<name>/` and is placed into every checkout and worktree by `cs sync` (hidden from git via
`.git/info/exclude`; `autoMemoryDirectory` points at the share). Newer content in a checkout flows back. Auto-memory,
`CLAUDE.md`/`.claude/` files or MCP servers that already exist on a machine are taken into the share with `cs import` (below).

## Secrets and trust

sops + age; every machine has its own key, only public keys are in the share. Values are decrypted into `claude`'s
environment at launch (the `claude()` shell function from `shell/cs.sh` runs `cs secrets exec -- claude`), so `${VAR}`
in a project state's `.mcp.json` resolves. Never plaintext in git.

```sh
cs secrets set global API_TOKEN=…        # shared across projects; available to Claude's MCP servers as ${API_TOKEN}
cs secrets set billing-api DB_URL=…      # project-scoped (overrides global)
cs secrets get global                    # masked; --show for values
cs secrets edit billing-api              # in $EDITOR
cs trust laptop                          # let another machine read the secrets (run where you already can; then cs sync on both)
```

A new machine gets access either by `cs trust <machine>` from a machine that already has it, or by pasting the
recovery key at `cs init`. Details, the `.env` rules and the threat model: `docs/SECRETS.md`.

## Identities

An identity is a git author (name, email) plus the GitHub owner and SSH key it commits as; a project uses the identity
whose owner its remote belongs to (git `includeIf hasconfig`, rendered by `cs sync`), so work and personal projects sit
side by side. There is deliberately no global `user.email`: a checkout that matches no identity refuses to commit
rather than committing as the wrong person.

```sh
cs identity                                                                     # list: commits as, owner, key present?, token stored?, projects
cs identity add acme --owner acme-org --name "Your Name" --email you@acme.com    # renders the git includes, offers to store a token for acme-org
cs identity rename acme client-a                                                # everywhere: manifest, projects, key files, published pubkeys
```

Each machine has its own SSH key per identity (`~/.ssh/cs/<id>`, GitHub title `cs:<machine>:<id>`), created and
registered at `cs init` (`cs ssh setup` later, hidden). GitHub API tokens are per owner, stored locally, never synced,
and asked for when first needed (`cs new` on that owner). Token permissions: fine-grained, resource owner = the user or
org, repository access *All repositories*, *Administration: read & write*; add *Git SSH keys: read & write* if
`cs ssh setup` should register keys for a user account. Overrides in the identity's block of `projects.toml`:
`ssh_key = "…"`, `url_globs = [...]`.

## Health and updates

```sh
cs doctor          # platform, tools, links, settings drift, identities, remotes, hooks, timer, old on-disk names
cs doctor --fix    # repairs what it can: missing GitHub repos, remotes with an old owner, on-disk names (docs/MIGRATION.md)
cs update          # the tool itself (git pull --ff-only in its checkout); `cs` says when one is available
```

## Setup

```sh
curl -fsSL https://raw.githubusercontent.com/r0-development/claude-share/master/install.sh | bash
```

One command on a fresh WSL2 Ubuntu or macOS: installs what is missing (Node 22 user-locally when there is no Node ≥ 18),
puts the tool in `~/.local/share/claude-share`, links `~/.local/bin/cs`, and starts `cs init` — a wizard: machine name;
join an existing share (paste its GitHub URL) or create one; a per-machine **share key** (deploy key, reaches only the
share) gets this machine in; which projects this machine gets and where they live; identities → SSH keys → tokens;
`~/.claude` rendered, project state placed, secrets access (trust from another machine, or the recovery key), hooks and
timer, doctor, clone. Every step is re-runnable; `cs init --repo <url> --name <machine> --profiles a,b --non-interactive`
for scripts. Details: `docs/BOOTSTRAP.md`; Windows: `docs/WINDOWS.md`.

Two repos: this tool (public) and your own share (private, holds all your data). Node 18+ and git — nothing else.
WSL2 on Windows, macOS, Linux; Windows-native is unsupported.

## Commands

What `cs --help` lists; `cs <command> -h` for options.

| command | what it does |
|---|---|
| `cs` | what is waiting for me, what is stale here |
| `cs sync` | the daily verb: bring this machine up to date and leave nothing stale here |
| `cs new <name>` | create a project: dir, git, private GitHub repo, first push, registered, Claude wired in |
| `cs add [path]` | register an existing directory as a project (default: cwd); creates its private GitHub repo when it has no remote |
| `cs remove <names...>` | take projects out of the share: manifest entry, project state, secrets; checkouts and remotes stay |
| `cs clone [names...]` | clone the projects selected for this machine that are missing here |
| `cs secrets` | encrypted secrets in the share: set \| get \| edit |
| `cs identity` | git identities: who commits, with which key, under which GitHub owner |
| `cs trust <machine>` | trust another machine: let it read the secrets |
| `cs doctor` | check this machine: tools, links, identities, remotes, hooks, timer; --fix repairs what it can |
| `cs update` | update the cs tool itself |
| `cs init` | set this machine up (wizard) — or --repo \<url\> / --owner \<owner\> for scripts |

## For debugging

Hidden commands: the halves `cs sync` is made of and a few helpers. They stay callable; nothing in daily use needs them.

| command | what it does |
|---|---|
| `cs status [--no-fetch] [--all]` | what bare `cs` shows (`--all` includes projects skipped by profile) |
| `cs share-sync [--pull-only\|--push-only] [--resolve ours\|theirs\|newest]` | the share alone: commit / pull --rebase / push — what the hooks and the timer run. It cannot ask, so a file changed on both machines is settled newest-wins; the share is never left mid-rebase |
| `cs handoff [-m note] [--all] [--allow <glob>] [--overwrite]` · `cs resume [--all] [--replace] [--keep-remote]` · `cs handoffs [ls\|gc\|drop]` | the handoff halves: send the cwd project's work, apply what is waiting, list / prune / drop waiting handoffs |
| `cs note --print` | print (once) the note of the last handoff applied for the cwd project — what the SessionStart hook runs |
| `cs apply [--check]` · `cs link [--check]` | render `~/.claude` and the git includes from the share; place project state into checkouts (`--check` reports drift, changes nothing) |
| `cs import memory\|project\|mcp <name>` | take auto-memory, `CLAUDE.md`/`.claude/`/`.mcp.json` or MCP servers (with their secrets, as `${VAR}`) that already exist on this machine into the project state |
| `cs hooks [install\|remove\|status] [--no-timer]` | the Claude Code hooks and the timer |
| `cs secrets init\|status\|unset\|exec\|recovery` | the secrets backend: this machine's key, run a command with the values in its environment, a recovery key for your password manager |
| `cs untrust <machine>` | remove a machine's access to the secrets and list what to rotate |
| `cs ssh [setup\|check\|share-key]` · `cs token set\|check\|rm <owner>` · `cs token ls` | identity keys and the share key; GitHub API tokens |
| `cs deps [--install]` · `cs share new\|path` · `cs project id` | prerequisites; a share skeleton, the share's path; the cwd project's name |
| `cs ui-demo` | every UI element with fake data |

## Migrating from an older version

Machines set up before the September 2026 redesign keep working; `cs doctor` lists the on-disk names that changed and
`cs doctor --fix` moves them. Run `cs sync` on both machines first so no handoff is waiting. See `docs/MIGRATION.md`.

## Developing

```sh
git clone https://github.com/r0-development/claude-share.git && cd claude-share
npm install            # dev toolchain only (TypeScript, esbuild, @clack/prompts, commander, smol-toml)
npm run build          # → dist/cs.js (committed; run by bin/cs)
npm test               # typecheck + build + unit (node:test) + e2e (tests/run-local.sh, throwaway HOME)
```
