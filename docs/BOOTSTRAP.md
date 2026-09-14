# Bootstrapping a machine

## First machine (you have nothing yet)

```sh
git clone https://github.com/r0-development/claude-share.git ~/dev/claude-share
~/dev/claude-share/bin/cs init --install-deps
```

`cs init` walks through, skipping anything already done:

| phase | what happens | needs you? |
|---|---|---|
| machine | `~/.config/claude-share/machine.toml` — name, profiles | name + profiles |
| prerequisites | git, ssh, age, sops, node, claude (user-local installs; apt/brew commands printed otherwise) | – |
| config repo | GitHub owner + a fine-grained token → creates private `<owner>/claude-share-config`, initializes, pushes | owner + token |
| first identity | name, email, ssh key → `[identities.<id>]`, git includes | answers |
| ssh keys | generates missing keys, publishes public halves, registers on GitHub via token (user accounts) or prints the key | maybe paste a key |
| apply | `~/.claude` rendered/linked, `~/.gitconfig` include, shell rc block (`claude()` wrapper) | – |
| link | side-store files into every checkout | – |
| secrets | age key for this machine; first machine becomes the only recipient | – |
| automatic sync | Claude Code hooks (in the config repo) + systemd/launchd timer | – |
| doctor | everything checked | – |

Then `cs identity add work --owner <org> --name .. --email .. --key ..` for more identities, and `cs new <project> --<identity>`.

## Every later machine

```sh
git clone https://github.com/r0-development/claude-share.git ~/dev/claude-share
~/dev/claude-share/bin/cs init --install-deps --repo git@github.com:<owner>/claude-share-config.git --key ~/.ssh/cs/personal --name work-mac --profiles work,personal
```

- Without `--key`, cs tries the default key and then asks which one can clone the config repo. On a truly bare machine
  generate one first: `ssh-keygen -t ed25519 -f ~/.ssh/cs/personal` and add the `.pub` to GitHub.
- After init: `cs clone` brings in the projects for this machine's profiles.
- Secrets: the new machine publishes its age public key; on a machine that already has access run
  `cs sync && cs enroll <new-machine>`; then `cs sync` on the new machine. Until then Claude runs without secrets.
- GitHub tokens are per machine: `cs token set <owner>` when you first need `cs new`.
- Log into Claude Code once (`claude`).

## Day to day

Nothing. Hooks push memory/plans after each Claude response and pull at session start; the timer syncs every 15 min.
`cs` shows the dashboard; `cs sync` when it says blocked; `cs doctor` when something feels off.

Open a **new shell** after the first `cs init` so the `claude()` wrapper (from `~/.bashrc` / `~/.zshrc`) is active.
