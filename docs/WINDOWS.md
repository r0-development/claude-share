# Windows: everything lives in WSL2

Windows-native Claude Code is not supported by cs (symlinks, hooks, paths and sandboxing all differ). Use WSL2.

One-time Windows-side setup (not automated):

1. `wsl --install -d Ubuntu-24.04`, then `wsl --update`. On an older distro add `[boot] systemd=true` to
   `/etc/wsl.conf` and `wsl --shutdown` — the sync timer needs systemd.
2. `%USERPROFILE%\.wslconfig`:
   ```
   [wsl2]
   memory=16GB
   autoMemoryReclaim=gradual
   sparseVhd=true
   ```
3. Windows Terminal with the Ubuntu profile as default; VS Code + the "WSL" extension, opened from inside WSL (`code .`).

Rules that matter:

- **Projects and `~/.claude` live on the WSL ext4 filesystem** (`~/dev`), never under `/mnt/c`. `/mnt/c` is a network
  mount: git is 10–50× slower, file watching breaks, permissions are faked, Defender scans it. `cs doctor` fails on it.
- Never open a WSL checkout with Git for Windows; never set `core.autocrlf` in WSL.
- SSH keys live in WSL `~/.ssh` (per machine, `cs ssh setup`). No agent forwarding from Windows.
- Clock drift after sleep breaks git timestamps and OAuth: `sudo hwclock -s` or `wsl --shutdown`.
- Sandbox-hostile leftovers like `file:Zone.Identifier` appear when files are copied from Windows; `cs new` gitignores them.
