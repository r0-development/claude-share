# claude-share (`cs`) — conventions for working on this repo

- TypeScript on Node 18+, bundled by esbuild into `dist/cs.js` (**committed** — a fresh machine runs it with Node only).
  Run `npm run build` before every commit that touches `src/`; `npm test` = typecheck + build + unit + e2e.
- Runtime deps are bundled; the only runtime prerequisite is Node. Keep dependencies few: `@clack/prompts`, `commander`, `smol-toml`, `picocolors`.
- One subcommand → one module in `src/`. `src/index.ts` only declares the command tree and dispatches.
- Every filesystem path comes from `src/paths.ts` (HOME / CLAUDE_CONFIG_DIR / CS_CONFIG_DIR / XDG_STATE_HOME overridable)
  so `tests/run-local.sh` runs against a throwaway HOME. `CS_ANSWERS` (JSON array) scripts every prompt; `CS_OFFLINE=1` disables network calls.
- All user interaction goes through `src/ui.ts` (clack). Never `console.log` in command modules except for machine-readable output.
- Anything under a spinner (`ui.spin`, `ui.group`) must be async: `proc.exec` / `git.gitA`. `spawnSync` blocks the event loop and freezes spinners — only use it for instant local git queries. `cs ui-demo` (hidden) exercises every element.
- Never write machine-specific values (absolute paths, hostnames) into the config repo; inject them at link/apply time.
- Never touch a user's git index, stash, or working tree in project repos (`git add -A` only in the config repo and `kind=synced` repos).
- `cs sync` must never leave a repo mid-rebase: abort, write a `blocked-*` marker, print the resolve commands.
- This repo is PUBLIC: no real names, emails, orgs, project names or hostnames anywhere (docs, examples, tests, commit messages) — placeholders only.
- No AI attribution lines in commit messages.
