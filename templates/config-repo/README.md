# claude-share config repo

Private. Holds everything `cs` syncs between your machines:

| path | what |
|---|---|
| `projects.toml` | manifest: projects, where they live, git identities |
| `claude/settings.base.json` (+ `settings.<profile>.json`, `settings.<machine>.json`) | layered `~/.claude/settings.json` |
| `claude/CLAUDE.md`, `claude/rules/`, `claude/skills/`, `claude/agents/`, `claude/keybindings.json`, `claude/themes/` | linked into `~/.claude` |
| `plans/` | linked to `~/.claude/plans` |
| `projects/<name>/` | per-project side-store: `CLAUDE.md`, `.claude/**`, `.mcp.json` (copied into checkouts), `memory/` (auto-memory lives here) |
| `machines/<name>/` | public keys only (`age.pub`, `ssh/*.pub`) |
| `secrets/` | sops+age encrypted env files — never plaintext (pre-commit guard) |

Machine-specific choices live outside this repo in `~/.config/claude-share/machine.toml`.
