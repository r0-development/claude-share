# claude-share (`cs`)

Keep your projects **and** your Claude Code setup identical on every machine.

- **Projects manifest** — one `projects.toml` says where each project lives (which GitHub owner, which identity),
  which machines get it, and whether it is a normal git repo, an auto-synced notes repo, or local-only.
- **Claude Code config** — `~/.claude/settings.json` (layered base → profile → machine), `CLAUDE.md`, rules, skills,
  agents, keybindings, plans: rendered/linked from a private config repo.
- **Per-project Claude state** — `CLAUDE.md`, `.claude/**`, `.mcp.json` and **auto-memory** live in a side-store in the
  config repo and are copied into every checkout (and worktree) without ever being committed to the project repo.
- **Git identity follows the remote URL** (`includeIf hasconfig`), so work and personal repos can sit side by side.
- **Secrets** — sops + age, per-machine keys, decrypted into `claude`'s environment at launch so `${VAR}` in `.mcp.json` resolve. Never plaintext in git.
- **Automatic sync** — Claude Code hooks push after each response and pull at session start; a timer syncs every 15 min.

Two repos: this tool (public) and your own config repo (private, holds all your data). Python 3.9+, git — nothing else.
WSL2 on Windows, macOS, Linux. Windows-native is unsupported.

## Quick start

```sh
git clone https://github.com/r0-development/claude-share.git ~/dev/claude-share   # public, no auth needed
ln -s ~/dev/claude-share/bin/cs ~/.local/bin/cs

cs init --install-deps      # first machine — interactive:
                            #   machine name + profiles
                            #   GitHub owner for your private config repo + a fine-grained token (stored locally)
                            #   → creates <owner>/claude-share-config, initializes and pushes it
                            #   first git identity (name, email, ssh key)
cs identity add work --owner <company-org> --name "Your Name" --email you@company.com
cs new <project> --personal        # dir, git init -b master, private GitHub repo, first push, registered, Claude wired in
```

Every later machine: same clone + `cs init --repo git@github.com:<owner>/claude-share-config.git --name work-mac --profiles work,personal`, then `cs clone`.
Details: `docs/BOOTSTRAP.md`.

`cs` with no arguments prints the dashboard. `cs <command> -h` for options.

---

## Identities

An identity answers three questions for a group of repositories: **who commits** (`user.name` / `user.email`),
**which SSH key** authenticates, and **which GitHub owner** (user or organization) new repos are created under.
Typical setup: one `personal` identity and one `work` identity.

Identity is selected **by the remote URL**, not by directory. `cs apply` renders a git include per identity
(`~/.config/git/identity-<id>.inc` with `user.*` and `core.sshCommand`) and an `includeIf "hasconfig:remote.*.url:git@github.com:<owner>/**"`
rule for each. Any repo whose `origin` is under that owner — cloned by `cs` or by hand — gets the right name, email and key
automatically. There is deliberately **no global `user.email`**: a repo that matches no identity refuses to commit instead of
committing as the wrong person.

| command | what it does |
|---|---|
| `cs identity` / `cs identity ls` | list identities: who they commit as, GitHub owner, whether the SSH key exists here, whether a token is stored, how many projects use each |
| `cs identity add <id> --owner <gh-owner> --name "<name>" --email <email> [--key <path>] [--gh-user <login>] [--no-token]` | add an identity to `projects.toml` (`url_globs = ["git@github.com:<owner>/**"]`), re-render the git includes, and offer to store a GitHub token for `<owner>` |
| `cs ssh setup` / `cs ssh check` | generate a missing key for each identity on this machine, publish the public half to the config repo, register it on GitHub (user accounts, via the token) or print it for pasting; verify with `ssh -T` |
| `cs token set <owner>` / `check` / `rm` / `ls` | GitHub fine-grained token per owner — lets `cs new` create repos and `cs ssh setup` register keys. Stored in `~/.config/claude-share/tokens/<owner>` (0600), never synced |
| `cs doctor --fix` | report repos whose resolved `user.email` doesn't match their identity; rewrite remotes that use an old owner name or SSH alias |

**SSH key naming.** Keys are per machine and never copied. Each identity owns one key:

```
~/.ssh/cs/<identity>          private   e.g. ~/.ssh/cs/personal, ~/.ssh/cs/work
~/.ssh/cs/<identity>.pub      public
comment / GitHub title        cs:<machine>:<identity>      e.g. cs:work-mac:work
config repo                   machines/<machine>/ssh/<identity>.pub
```

So the file name says what a key is for, and the GitHub title says which machine it belongs to (revoke "the laptop's
work key" by name). `--key` overrides the path for an identity; `--gh-user` is the GitHub login used to verify the key
(`Hi <login>!`); `--no-token` skips the token prompt.

Examples:

```sh
# personal account: repos under github.com/<you>
cs identity add personal --owner <you> --name "Your Name" --email you@example.com

# company organization: commits with the work address, default key
cs identity add work --owner <company-org> --name "Your Name" --email you@company.com --gh-user <your-work-login>

cs identity                      # id | commits as | github owner | ssh key | token | projects
cs ssh setup                     # keys generated/published/registered; prints anything you must paste on GitHub
cs token set <company-org>       # once per machine; needed before `cs new <project> --work`

cs new api-gateway --work        # identity by id …
cs new api-gateway --<company-org>   # … or by GitHub owner — both select the same identity
```

Token permissions (GitHub → Settings → Developer settings → Fine-grained tokens): resource owner = the user or org,
repository access **All repositories**, **Administration: read & write** (Metadata is added automatically).
To let `cs ssh setup` register keys for a user account add the account permission **Git SSH keys: read & write**.

Editing an identity (email, key, extra owners): change its `[identities.<id>]` block in `projects.toml`, then `cs apply`.
An identity can list several `url_globs` — useful when an org was renamed.

---

## Projects

Every project is a `[projects.<name>]` entry in `projects.toml` and a directory `~/dev/<name>` (same layout on every machine).

| command | what it does |
|---|---|
| `cs new <name> --<identity>` | brand-new project: `mkdir`, `git init -b master`, private GitHub repo under the identity's owner, first commit + push, register, link Claude files. Re-runnable. `--public`, `--no-github`, `--synced`, `-d "description"` |
| `cs add [path]` | register an existing directory (default: cwd; infers url, branch, identity, worktree layout) |
| `cs clone [name…]` | clone the projects this machine's profiles select but that are missing here |
| `cs status` / `cs` | every project: branch, dirty, unpushed, behind, identity mismatch, missing, unregistered dirs |

Project kinds: `git` (normal), `synced` (auto-committed notes; no manual git), `local` (registered so other machines know
it exists, never cloned). `profiles` decide which machines get a project; `machines = [...]` is a hard allowlist;
`layout = "worktrees"` for a `<name>/repo` clone with sibling worktrees.

```sh
cs new <project> --personal
cs new <project> --personal --synced     # notes: committed and pushed automatically by cs sync
cd ~/dev/existing-thing && cs add --profiles personal
cs clone                                  # on a new machine after cs init
```

---

## Claude Code config and memory

`~/.claude` is rendered from `<config repo>/claude/` by `cs apply`; per-project files come from `<config repo>/projects/<name>/`
via `cs link`.

| command | what it does |
|---|---|
| `cs apply [--check]` | `settings.json` = `settings.base.json` ⊕ `settings.<profile>.json` ⊕ `settings.<machine>.json`; symlink `CLAUDE.md`, `rules/`, `skills/*`, `agents/`, `themes/`, `keybindings.json`, `plans/`; git identity includes; shell rc block |
| `cs link [name…] [--check]` | copy `CLAUDE.md`, `.claude/**`, `.mcp.json` from the side-store into each checkout and worktree (hidden from git via `.git/info/exclude`); point `autoMemoryDirectory` at the config repo; newer content flows back |
| `cs adopt memory <name>` | move existing auto-memory from `~/.claude/projects/…/memory` into the side-store |
| `cs adopt project <name>` | take existing Claude files from a checkout into the side-store |
| `cs adopt mcp <name>` | move MCP servers (with secrets) from `~/.claude.json` into the side-store `.mcp.json` with `${VAR}` placeholders |

Global rules for all projects: `claude/CLAUDE.md` and `claude/rules/*.md` in the config repo (`cs apply` links them to `~/.claude`).

---

## Secrets

sops + age; every machine has its own key, only public keys are committed. See `docs/SECRETS.md`.

```sh
cs secrets set global COOLIFY_TOKEN=…     # shared across projects
cs secrets set <project> DB_PASSWORD=…    # project-scoped (overrides global)
cs secrets get global                      # masked; --show for values
cs secrets push <project>                  # encrypt the project's .env into the store; pull / diff for the other direction
cs enroll <machine>                        # grant a new machine access (run where you already have it)
cs secrets recovery                        # print a recovery key once → password manager
```

`claude` (the shell function from `shell/cs.sh`) runs `cs secrets exec -- claude`, so `${VAR}` in `.mcp.json` resolve.

---

## Sync, machines, health

| command | what it does |
|---|---|
| `cs sync` | commit → pull --rebase → push the config repo (+ `synced` projects). Memory/plan collisions union-merge; other conflicts abort cleanly: `cs sync --resolve ours\|theirs` |
| `cs hooks install\|status\|remove` | Claude Code hooks (push after each response, pull at session start) + a 15-min timer (systemd user / launchd) |
| `cs doctor [--fix]` | platform, tools, links, settings drift, identities, remotes, leftover local-scope MCP secrets |
| `cs deps [--install]` | prerequisites; installs age, sops, fnm, claude user-locally |
| `cs self-update` | update the tool |

Docs: `docs/BOOTSTRAP.md`, `docs/SECRETS.md`, `docs/WINDOWS.md`.
