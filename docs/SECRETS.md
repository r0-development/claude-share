# Secrets

Backend: **sops + age**. Everything under `secrets/` in the share is encrypted per value; keys stay readable
so diffs make sense. A pre-commit guard refuses plaintext there.

```
<share>/
  .sops.yaml                       recipients (public keys) — managed by cs
  machines/<machine>/age.pub       each machine's public key
  secrets/global.env               shared across projects (encrypted)
  secrets/projects/<name>.env      the project's .env (encrypted); .env.<x> is <name>.<x>.env
~/.config/sops/age/keys.txt        this machine's private key (0600, never leaves the machine)
```

| command | |
|---|---|
| `cs secrets init` | create this machine's key, publish the public half; first machine becomes the only recipient |
| `cs trust <machine>` | (on a machine with access) grant a new machine access; re-encrypts everything. The setup wizard walks a new machine through this, or accepts the recovery key instead |
| `cs untrust <machine>` | remove access and list what to rotate |
| `cs secrets set global KEY=VALUE …` / `unset` / `get [--show]` / `edit` | manage values |
| `cs secrets set <project> KEY=VALUE` | project-scoped values (override global) |
| `cs sync` | carries the project's gitignored `.env*` files, merged per key (below) |
| `cs secrets exec [-p project] -- cmd` | run anything with global + project values in its environment |
| `cs secrets recovery` | add a recovery recipient; prints its private key once for your password manager |

## `.env` files (ADR-0003)

Which files `cs sync` carries is decided by the file name and git, never by a question:

| file | travels | why |
|---|---|---|
| tracked by git (`.env.example`) | no | git's business |
| gitignored `.env`, `.env.production`, `.env.<anything>` | with its values, encrypted in the share | project secrets follow you |
| gitignored `*.local` (`.env.local`, `.env.*.local`, plus `env.local = [...]` in the manifest) | keys only | site-specific values stay per machine |
| untracked and not gitignored | refused: "not carried (add it to .gitignore)" | git would commit it |

`env = false` under `[projects.<name>]` opts the project out entirely.

Each file is one entry in `secrets/projects/` and one row on the plan screen when something would move. The merge is per
key against the snapshot `cs sync` kept here after the last sync (`~/.local/state/cs/env/<project>/<file>`, 0600): a key
changed on one side only is taken from that side, a key removed on one side is removed, an unrelated key is never lost,
and a key changed on both machines since the last sync is asked — this machine's value or the other machine's, with the
newer one offered first (no terminal: newest wins). A file missing on one side (fresh checkout, entry dropped from the
share) is pulled or stored again, never deleted on the other side. The local file is patched line by line, so comments,
order and quoting survive, and its previous text is kept as `<file>.prev` next to the snapshot; a file that arrives on a
machine for the first time is written 0600. `cs` shows `.env: store 1 key,
take 2 keys from laptop` on the project's line while something is pending.

Keys-only files (`.env.local`) go through the same entry with blank values and the same three-way merge, on the *set of
keys*: a key added on one machine appears on the other with the value from `.env.example` when that file has it, else
empty (`KEY=`); a key removed on one machine leaves the other machine's file too (its previous text is kept as
`<file>.prev`); a value already there is never changed, whatever the share or the example says. Nothing secret moves and
nothing is overwritten, so there is no plan row — `cs sync` just does it and says `one · .env.local: 2 keys taken from
desk — to fill in: KEY`. Bare `cs` shows `.env.local: 1 key to fill in (KEY)` until the value is filled in.

## How Claude gets them

`shell/cs.sh` (sourced from your shell rc by `cs apply`) defines `claude()` as
`cs -q secrets exec -- command claude "$@"`, so every MCP server spawned by Claude inherits the decrypted values.
Reference them in the project state `.mcp.json` as `${NAME}` — `cs import mcp <project>` writes exactly that.
IDE-launched Claude bypasses the wrapper: start the IDE from a `cs-shell`, or use
`"command": "cs", "args": ["secrets", "exec", "--", "npx", …]` for that server.

## Threat model

Protects against a leaked share, a lost machine (untrust + rotate), accidental plaintext commits, and secrets
leaking into every shell (only the `claude` process tree sees them). Does not protect against a compromised running
machine or a malicious MCP server. Keep disk encryption on: the age key file is plain.
