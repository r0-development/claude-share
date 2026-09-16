# Secrets

Backend: **sops + age**. Everything under `secrets/` in the share is encrypted per value; keys stay readable
so diffs make sense. A pre-commit guard refuses plaintext there.

```
<share>/
  .sops.yaml                       recipients (public keys) — managed by cs
  machines/<machine>/age.pub       each machine's public key
  secrets/global.env               shared across projects (encrypted)
  secrets/projects/<name>.env      per project (encrypted)
~/.config/sops/age/keys.txt        this machine's private key (0600, never leaves the machine)
```

| command | |
|---|---|
| `cs secrets init` | create this machine's key, publish the public half; first machine becomes the only recipient |
| `cs trust <machine>` | (on a machine with access) grant a new machine access; re-encrypts everything. The setup wizard walks a new machine through this, or accepts the recovery key instead |
| `cs untrust <machine>` | remove access and list what to rotate |
| `cs secrets set global KEY=VALUE …` / `unset` / `get [--show]` / `edit` | manage values |
| `cs secrets set <project> KEY=VALUE` | project-scoped values (override global) |
| `cs secrets push <project>` / `pull <project>` / `diff <project>` | the project's whole `.env` file ⇄ the store |
| `cs secrets exec [-p project] -- cmd` | run anything with global + project values in its environment |
| `cs secrets recovery` | add a recovery recipient; prints its private key once for your password manager |

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
