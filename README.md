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

Two repos: this tool (public) and your own config repo (private, holds all your data). Node 18+ and git — nothing else
(the installer brings Node if it's missing). WSL2 on Windows, macOS, Linux. Windows-native is unsupported.

## Quick start

```sh
curl -fsSL https://raw.githubusercontent.com/r0-development/claude-share/master/install.sh | bash
```

One command on a fresh WSL2 Ubuntu or macOS: installs prerequisites (apt on Debian/Ubuntu, Node 22 user-local from
nodejs.org), the tool to `~/.local/share/claude-share`, links `~/.local/bin/cs`, and starts `cs init` — a wizard: join an existing share (paste its GitHub URL) or create a new one; a per-machine **master key**
gets this machine into the config repo (deploy key); pick a machine name and profiles; identities from the repo get their
SSH keys and tokens; choose where projects live (default `~/dev`); then everything is applied and projects can be cloned. Details: `docs/BOOTSTRAP.md`.

```sh
cs identity add acme --owner acme-org --name "Your Name" --email you@acme.com   # more identities
cs new <project> --acme            # dir, git init -b master, private GitHub repo, first push, registered, Claude wired in
```

`cs` with no arguments prints the dashboard. `cs <command> -h` for options.

---

## Identities

Two things matter:

- **GitHub owner** — the account a repository lives under: *you* (`<your-login>`) or an *organization* (`acme-org`).
  Repo creation, the API token and the URL `git@github.com:<owner>/<repo>` all hang off it.
- **Identity** — how you act toward one owner: the name/email on commits and the SSH key. Its id is a nickname you
  type (`--personal`, `--acme`). Name identities after the owner they belong to; one per client/employer org.

Everything else is derived. An identity in `projects.toml` is just:

```toml
[identities.acme]
owner = "acme-org"
name  = "Your Name"
email = "you@acme.com"
```

| derived | value |
|---|---|
| SSH key (per machine, never copied) | `~/.ssh/cs/<id>` — generated and registered by `cs ssh setup`; GitHub title `cs:<machine>:<id>` |
| which repos use it | any repo whose `origin` is `git@github.com:<owner>/…` (git `includeIf hasconfig`, rendered by `cs apply`) — cloned by `cs` or by hand |
| GitHub login of the key | whatever `ssh -T` reports; for an org it is *your user account* that is a member of the org |
| API token | per owner, `cs token set <owner>` (asked for automatically when first needed); stored locally, never synced |

There is deliberately **no global `user.email`**: a repo that matches no identity refuses to commit rather than committing as the wrong person.

| command | what it does |
|---|---|
| `cs identity` | list: commits as, owner, key present?, token stored?, projects using it |
| `cs identity add <id> --owner <owner> --name "<name>" --email <email>` | add it, render git includes, offer to store a token for `<owner>` (`--key <path>` to use an existing key, `--no-token`) |
| `cs identity rename <old> <new>` | rename everywhere (manifest, projects, key files, published pubkeys, includes) |
| `cs ssh setup` / `cs ssh check` | create missing identity keys, publish public halves, register on GitHub (user accounts, via token) or print for pasting; verify |
| `cs ssh master` | the machine's **master key** `~/.ssh/cs/master`: reaches the config repo only (deploy key); nothing else uses it |
| `cs token set\|check\|rm\|ls <owner>` | API tokens |
| `cs doctor --fix` | report identity mismatches; rewrite remotes that use an old owner name or SSH alias |

```sh
cs identity add personal --owner <your-login> --name "Your Name" --email you@example.com
cs identity add acme     --owner acme-org     --name "Your Name" --email you@acme.com
cs ssh setup                       # prints any public key you still have to paste on GitHub
cs new billing-api --acme          # or --acme-org: id and owner both select the identity
```

Token permissions (GitHub → Settings → Developer settings → Fine-grained tokens): resource owner = the user or org,
repository access **All repositories**, **Administration: read & write**. Add the account permission
**Git SSH keys: read & write** if `cs ssh setup` should register keys for a user account.

Overrides for unusual cases go in the identity's block: `ssh_key = "…"` (a key elsewhere), `url_globs = [...]`
(extra URL patterns, e.g. an org's old name).

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
| `cs apply [--check]` | `settings.json` = `settings.base.json` ⊕ `settings.<profile>.json` ⊕ `settings.<machine>.json`; symlink `CLAUDE.md`, `rules/`, `skills/*`, `agents/`, `themes/`, `keybindings.json`, `plans/`; `~/.agents/skills` → `claude/skills` so `npx skills add … -g` (skills.sh) installs into the config repo; git identity includes; shell rc block |
| `cs link [name…] [--check]` | copy `CLAUDE.md`, `.claude/**`, `.mcp.json` from the side-store into each checkout and worktree (hidden from git via `.git/info/exclude`); point `autoMemoryDirectory` at the config repo; newer content flows back |
| `cs adopt memory <name>` | move existing auto-memory from `~/.claude/projects/…/memory` into the side-store |
| `cs adopt project <name>` | take existing Claude files from a checkout into the side-store |
| `cs adopt mcp <name>` | move MCP servers (with secrets) from `~/.claude.json` into the side-store `.mcp.json` with `${VAR}` placeholders |

Global rules for all projects: `claude/CLAUDE.md` and `claude/rules/*.md` in the config repo (`cs apply` links them to `~/.claude`, so editing
`~/.claude/CLAUDE.md` edits the repo). Global skills: `claude/skills/<name>/SKILL.md` — write them there or `npx skills add <owner/repo> -g`.

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

## Handoff — uncommitted work between machines

```sh
cs handoff -m "where I stopped"      # snapshot the cwd project's working tree → wip/<user>/<branch> on its remote
cs resume                            # on the other machine: back to uncommitted changes, branch deleted, note shown
cs wip                               # parcels waiting · cs wip gc --older-than 14
```

Manual by design — nothing is pushed to a company remote by itself; `cs status` reminds you when a session ended with
uncommitted work. The sending machine is never touched (private index), secrets-looking files are refused, worktrees are
created on demand. See `docs/HANDOFF.md`.

---

## Sync, machines, health

| command | what it does |
|---|---|
| `cs sync` | commit → pull --rebase → push the config repo (+ `synced` projects). Memory/plan collisions union-merge; other conflicts abort cleanly: `cs sync --resolve ours\|theirs` |
| `cs hooks install\|status\|remove` | Claude Code hooks (push after each response, pull at session start) + a 15-min timer (systemd user / launchd) |
| `cs doctor [--fix]` | platform, tools, links, settings drift, identities, remotes, leftover local-scope MCP secrets |
| `cs deps [--install]` | prerequisites; installs age, sops, fnm, claude user-locally |
| `cs update` | update the tool |

Docs: `docs/BOOTSTRAP.md`, `docs/SECRETS.md`, `docs/WINDOWS.md`.

## Developing

```sh
git clone https://github.com/r0-development/claude-share.git && cd claude-share
npm install            # dev toolchain only (TypeScript, esbuild, @clack/prompts, commander, smol-toml)
npm run build          # → dist/cs.js (committed; bin/cs runs it)
npm test               # typecheck + build + unit (node:test) + e2e (tests/run-local.sh, throwaway HOME)
```
