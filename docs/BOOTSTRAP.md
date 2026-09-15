# Bootstrapping a machine

```sh
curl -fsSL https://raw.githubusercontent.com/r0-development/claude-share/master/install.sh | bash
```

Nothing to install first. On Debian/Ubuntu (WSL) the installer uses `sudo apt-get` for `git`/`curl`/`tar` if they are
missing; on macOS it asks for `xcode-select --install`. Node 22 is installed user-locally from nodejs.org when no Node ≥ 18
exists. Then it clones the tool to `~/.local/share/claude-share`, links `~/.local/bin/cs` and starts `cs init` — a wizard.
Arguments after `bash -s --` go to `cs init` (e.g. `bash -s -- --repo <url> --name laptop --profiles personal`). Everything is re-runnable; finished steps are skipped.

## 1. Machine name, then join an existing share or create one

First question: what this machine is called (`desktop-work`, `laptop`, …). Every key it creates carries that name
(`cs:<machine>:master`, `cs:<machine>:<identity>`), so keys are recognizable on GitHub and revocable per machine.

**Join** — paste the config repo URL in any form (`https://github.com/<owner>/claude-share-config` is fine).
cs checks whether the repo exists (public or private), then makes sure this machine can reach it:

- a **master key** `~/.ssh/cs/master` is generated. It is this machine's key for the config repo *only* — separate
  from all identities and never involving a token.
- the public key is shown with the link `…/settings/keys/new` and the title to use; add it as a **deploy key with write
  access** (your account's SSH keys work too), choose *Done — check access*, and cs verifies it.
- the repo is cloned to `~/.config/claude-share/repo`, pinned to the master key.

**Create** — name the repo (default `claude-share-config`), create it *empty and private* on GitHub, paste its URL;
same master-key step; cs initializes it from the template and pushes.

## 2. Projects and location

Existing machines in the share are listed (a clash asks whether to re-use the name). Then pick **which projects this
machine should clone and sync** — grouped by profile, everything selected by default — and where they live (`~/dev`
recommended and created for you; on WSL keep it in the Linux filesystem, not `/mnt/c`).

## 3. Identities → keys → tokens

Only the identities used by the selected projects are set up. For each one cs generates `~/.ssh/cs/<id>` if missing,
publishes the public half to `machines/<machine>/ssh/`, and shows the key with its title and the account it belongs on
(an org key goes on *your user account* that is a member of the org); *Done — verify* checks it with `ssh -T`.
Then it offers to store a GitHub token per owner (needed only for `cs new`; skippable).

On a brand-new share the wizard first asks for your first identity.

## 4. Apply, link, secrets, hooks, doctor, clone

`~/.claude` is rendered, Claude files are linked, this machine's age key is created and published, the Claude Code
hooks and the 15-minute timer are installed, doctor runs, and cs offers to clone the projects for your profiles.

Afterwards: **open a new terminal** (the `claude()` wrapper), log into Claude Code once (`claude`), and on a machine
that already has secrets run `cs sync && cs enroll <new-machine>` — until then Claude runs there without secrets.

## Scripted / non-interactive

```sh
cs init --repo https://github.com/<owner>/claude-share-config --name work-mac --profiles personal,acme --non-interactive
```
Fails with instructions instead of prompting when the master key is not yet registered.

## Day to day

Nothing. Hooks push after each Claude response and pull at session start; the timer syncs every 15 min.
`cs` shows the dashboard; `cs sync` when it says blocked; `cs doctor` when something feels off.
