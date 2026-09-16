# claude-share (`cs`)

Keep your projects **and** your Claude Code setup identical on every machine.

- **Projects manifest** — one `projects.toml` says where each project lives (which GitHub owner, which identity),
  which machines get it, and whether it is a normal git repo, an auto-synced notes repo, or local-only.
- **Claude Code config** — `~/.claude/settings.json` (layered base → profile → machine), `CLAUDE.md`, rules, skills,
  agents, keybindings, plans: rendered/linked from a private share.
- **Per-project Claude state** — `CLAUDE.md`, `.claude/**`, `.mcp.json` and **auto-memory** live in a project state in the
  share and are copied into every checkout (and worktree) without ever being committed to the project repo.
- **Git identity follows the remote URL** (`includeIf hasconfig`), so work and personal repos can sit side by side.
- **Secrets** — sops + age, per-machine keys, decrypted into `claude`'s environment at launch so `${VAR}` in `.mcp.json` resolve. Never plaintext in git.
- **Automatic sync** — Claude Code hooks push after each response and pull at session start; a timer syncs every 15 min.

Two repos: this tool (public) and your own share (private, holds all your data). Node 18+ and git — nothing else
(the installer brings Node if it's missing). WSL2 on Windows, macOS, Linux. Windows-native is unsupported.

## Quick start

```sh
curl -fsSL https://raw.githubusercontent.com/r0-development/claude-share/master/install.sh | bash
```

One command on a fresh WSL2 Ubuntu or macOS: installs prerequisites (apt on Debian/Ubuntu, Node 22 user-local from
nodejs.org), the tool to `~/.local/share/claude-share`, links `~/.local/bin/cs`, and starts `cs init` — a wizard: join an existing share (paste its GitHub URL) or create a new one; a per-machine **share key**
gets this machine into the share (deploy key); pick a machine name and profiles; identities from the repo get their
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
| `cs ssh share-key` | the machine's **share key** `~/.ssh/cs/share`: reaches the share only (deploy key); nothing else uses it |
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
| `cs` | fetches and shows one line per project — branch, dirty, ↑unpushed, handoff waiting from *machine*, `.env: store N keys`, `.env.local: 1 key to fill in`, missing here — the share's state and last sync, unregistered dirs; ends with `run: cs sync` when anything is pending (exit 1). `cs --no-fetch` for scripts |

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

`~/.claude` is rendered from `<share>/claude/` by `cs apply`; per-project files come from `<share>/projects/<name>/`
via `cs link`.

| command | what it does |
|---|---|
| `cs apply [--check]` | `settings.json` = `settings.base.json` ⊕ `settings.<profile>.json` ⊕ `settings.<machine>.json`; symlink `CLAUDE.md`, `rules/`, `skills/*`, `agents/`, `themes/`, `keybindings.json`, `plans/`; `~/.agents/skills` → `claude/skills` so `npx skills add … -g` (skills.sh) installs into the share; git identity includes; shell rc block |
| `cs link [name…] [--check]` | copy `CLAUDE.md`, `.claude/**`, `.mcp.json` from the project state into each checkout and worktree (hidden from git via `.git/info/exclude`); point `autoMemoryDirectory` at the share; newer content flows back |
| `cs import memory <name>` | move existing auto-memory from `~/.claude/projects/…/memory` into the project state |
| `cs import project <name>` | take existing Claude files from a checkout into the project state |
| `cs import mcp <name>` | move MCP servers (with secrets) from `~/.claude.json` into the project state `.mcp.json` with `${VAR}` placeholders |

Global rules for all projects: `claude/CLAUDE.md` and `claude/rules/*.md` in the share (`cs apply` links them to `~/.claude`, so editing
`~/.claude/CLAUDE.md` edits the repo). Global skills: `claude/skills/<name>/SKILL.md` — write them there or `npx skills add <owner/repo> -g`.

---

## Secrets

sops + age; every machine has its own key, only public keys are committed. See `docs/SECRETS.md`.

```sh
cs secrets set global COOLIFY_TOKEN=…     # shared across projects
cs secrets set <project> DB_PASSWORD=…    # project-scoped (overrides global)
cs secrets get global                      # masked; --show for values
cs sync                                    # carries every gitignored .env* of a project, merged per key (see below); push / pull / diff <project> are the manual halves
cs trust <machine>                        # grant a new machine access (run where you already have it)
cs secrets recovery                        # print a recovery key once → password manager
```

`claude` (the shell function from `shell/cs.sh`) runs `cs secrets exec -- claude`, so `${VAR}` in `.mcp.json` resolve.

---

## `cs sync` — leaving and arriving with one verb

```sh
cs sync                              # when leaving and when arriving; -m "where I stopped" sets the handoff note
```

Every handoff carries a note. Without `-m` it is written by headless `claude` from the project's latest session
transcript ("where this stopped, what's next" — under a spinner, capped); when there is no transcript, no `claude` on
PATH, no network, or it fails or runs past the cap, the note is derived from git instead (branch, changed files, last commit,
session end time, and why there is no summary). The note is shown when the handoff is applied and again at the next
session start there.

One run: pulls the share and repairs `~/.claude`, project state, hooks and timer without asking; clones projects
missing here; then shows **one plan screen** — handoffs to send (dirty work here) and handoffs to apply (work waiting
for this machine), both pre-checked, and branches with unpushed commits, listed **unchecked** (`↑N unpushed` in `cs`) —
and one confirmation. Nothing is written to a project remote before that screen, and a real branch is only ever pushed
from it; a handoff carries the local-only commits either way. An empty plan skips the screen ("nothing to move"). Offline, the local parts still run. A dirty checkout with a handoff waiting for
the same branch is asked afterwards: keep mine and leave it waiting (default) / apply the handoff / send mine over it —
whichever side loses is kept in `refs/cs/backup/<branch>/<time>` of that checkout, never deleted. Handoffs live on `handoff/<user>/<branch>` of
the project's own remote; the sending machine is never touched (private index), secrets-looking files are refused,
worktrees are created on demand. The manual halves (`cs handoff`, `cs resume`, `cs handoffs`) stay callable but hidden.
See `docs/HANDOFF.md`.

**`.env` files** travel with the same run, through the share, never through a handoff: every gitignored `.env`,
`.env.production`, … at a project's root is one encrypted entry in the share's secrets area, and each file with something
to move is a row on the plan screen (`one · .env  store 2 keys, take 1 key from laptop`, pre-checked). Values merge per
key against the last-synced snapshot, so a key changed on the other machine is never lost and the local file is patched in
place (comments and order kept); only a key changed on both machines since the last sync is asked, per key (no terminal:
newest wins). Gitignored `.env.local` / `.env.*.local` (and `env.local = [...]`) travel **keys only**, without a row: a key
new on the other machine arrives with the `.env.example` value or empty, an existing value is never touched, and `cs`
says `.env.local: 1 key to fill in (KEY)` until it is. Files git tracks (`.env.example`) are git's business; a `.env` git
would commit is refused until it is gitignored; `env = false` on a project opts it out. See `docs/SECRETS.md`.

---

## Sync, machines, health

| command | what it does |
|---|---|
| `cs sync` | the daily verb (above). The share part: commit → pull --rebase → push; memory/plan collisions union-merge; a file changed on both machines is asked per file (this machine's / the other machine's version) and the rebase finishes in the same run |
| `cs share-sync` (hidden) | the share alone — what the Claude Code hooks (push after each response, pull at session start) and the 15-min timer run; cannot ask, so a file changed on both machines is settled newest-wins (`--resolve ours\|theirs` overrides); the share is never left blocked or mid-rebase. `cs sync` re-installs both |
| `cs doctor [--fix]` | platform, tools, links, settings drift, identities, remotes, hooks and timer, leftover local-scope MCP secrets, old on-disk names (`--fix` performs the local moves; `docs/MIGRATION.md`) |
| `cs deps [--install]` | prerequisites; installs age, sops, fnm, claude user-locally |
| `cs update` | update the tool |

Docs: `docs/BOOTSTRAP.md`, `docs/SECRETS.md`, `docs/HANDOFF.md`, `docs/MIGRATION.md`, `docs/WINDOWS.md`.

## Developing

```sh
git clone https://github.com/r0-development/claude-share.git && cd claude-share
npm install            # dev toolchain only (TypeScript, esbuild, @clack/prompts, commander, smol-toml)
npm run build          # → dist/cs.js (committed; bin/cs runs it)
npm test               # typecheck + build + unit (node:test) + e2e (tests/run-local.sh, throwaway HOME)
```
