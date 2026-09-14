# claude-share (`cs`)

Keep your projects **and** your Claude Code setup identical on every machine.

- **Projects manifest** — one `projects.toml` says where each project lives (which GitHub org, which identity),
  which machines get it, and whether it is a normal git repo, an auto-synced notes repo, or local-only.
- **Claude Code config** — `~/.claude/settings.json` (layered base → profile → machine), `CLAUDE.md`, rules, skills,
  agents, keybindings, plans: rendered/linked from a private config repo.
- **Per-project Claude state** — `CLAUDE.md`, `.claude/**`, `.mcp.json` and **auto-memory** live in a side-store in the
  config repo and are copied into every checkout (and worktree) without ever being committed to the project repo.
- **Git identity follows the remote URL** (`includeIf hasconfig`), so work and personal repos can sit side by side.
- **Secrets** (M1): sops + age, per-machine keys, injected into `claude` at launch. Never plaintext in git.

Two repos: this tool and your config repo — both private . Python 3.9+, git — nothing else.
WSL2 on Windows, macOS, Linux. Windows-native is unsupported.

## Quick start

```sh
git clone git@github.com:r0-development/claude-share.git ~/dev/claude-share
ln -s ~/dev/claude-share/bin/cs ~/.local/bin/cs

cs config new ~/claude-config          # skeleton; edit projects.toml; push it to a private repo
cs init --repo ~/claude-config --name my-desktop --profiles personal
cs status
```

Second machine: same install, then `cs init --repo git@github.com:you/claude-config.git --name laptop --profiles work,personal && cs clone`.

## Commands

| command | what |
|---|---|
| `cs init` | set the machine up (re-runnable phases) |
| `cs apply [--check]` | render `~/.claude` + git identity includes |
| `cs link [--check]` | side-store ⇄ checkouts (newer wins) |
| `cs adopt memory\|project\|mcp <name>` | pull existing local state into the config repo |
| `cs sync` | commit / pull --rebase / push the config repo (+ synced projects); never leaves a half-rebase |
| `cs status`, `cs doctor [--fix]` | overview / health checks |
| `cs new <name> --personal` | brand-new project: dir, `git init -b master`, GitHub repo (via stored token), first push, register, link |
| `cs token set <identity>` | store a GitHub fine-grained token for `cs new` (local file, 0600, never synced) |
| `cs add [path]`, `cs clone` | register an existing dir / materialize missing projects |

### Creating projects

```sh
cs token set <owner>             # once per machine: fine-grained token for that GitHub user/org
cs new <project> --personal      # → ~/dev/<project>, private repo <owner>/<project>, registered, Claude wired in
cs new <project> --work          # --<identity> or --<github_owner> both work
cs new <project> --personal --synced   # auto-committed notes project (no manual git)
```

Token permissions (GitHub → Settings → Developer settings → Fine-grained tokens): resource owner = the account/org,
repository access "All repositories", permissions **Administration: read & write**, **Metadata: read**.

See `docs/DESIGN.md` for the full design and roadmap (handoff of uncommitted work, secrets, bootstrap).
