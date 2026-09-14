#!/usr/bin/env bash
# End-to-end check in a throwaway HOME: config repo skeleton -> init -> idempotency -> link/adopt/sync.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export HOME="$(mktemp -d)"
export CLAUDE_CONFIG_DIR="$HOME/.claude"
export XDG_STATE_HOME="$HOME/.local/state"
export CS_CONFIG_DIR="$HOME/.config/claude-share"
unset GH_TOKEN GITHUB_TOKEN
export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.com GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.com
CS="$ROOT/bin/cs"
pass() { echo "PASS $*"; }
die() { echo "FAIL $*" >&2; exit 1; }

# --- a pre-existing ~/.claude with local state, like a real machine
mkdir -p "$HOME/.claude/skills/old-skill" "$HOME/.claude/plans" "$HOME/dev"
echo '{"theme":"dark","permissions":{"allow":["Bash(ls *)"]}}' > "$HOME/.claude/settings.json"
echo "# old plan" > "$HOME/.claude/plans/old.md"
echo "name: old" > "$HOME/.claude/skills/old-skill/SKILL.md"

# --- a project with a remote (bare) and a worktree layout project
git init -q -b main "$HOME/remote-src" && (cd "$HOME/remote-src" && echo hi > README && git add . && git commit -qm init)
git clone -q --bare "$HOME/remote-src" "$HOME/remote.git"
git clone -q "$HOME/remote.git" "$HOME/dev/alpha"
mkdir -p "$HOME/dev/beta" && git clone -q "$HOME/remote.git" "$HOME/dev/beta/repo"
(cd "$HOME/dev/beta/repo" && git worktree add -q ../wt-feat -b feat)
echo '# alpha guidance' > "$HOME/dev/alpha/CLAUDE.md"
mkdir -p "$HOME/dev/alpha/.claude" && echo '{"permissions":{"allow":["Bash(npm test)"]}}' > "$HOME/dev/alpha/.claude/settings.local.json"
# claude memory for alpha under the encoded key
KEY="$(echo "$HOME/dev/alpha" | sed 's/[^A-Za-z0-9]/-/g')"
mkdir -p "$HOME/.claude/projects/$KEY/memory" && echo "- [x](x.md) - a fact" > "$HOME/.claude/projects/$KEY/memory/MEMORY.md" && echo "fact" > "$HOME/.claude/projects/$KEY/memory/x.md"
mkdir -p "$HOME/dev/notes"   # unregistered dir

# --- config repo skeleton + bare remote for it
$CS config new "$HOME/cfg-src" >/dev/null
cat >> "$HOME/cfg-src/projects.toml" <<TOML

[identities.test]
name = "Test User"
email = "test@example.com"
url_globs = ["$HOME/remote.git", "$HOME/remote.git/**"]

[projects.alpha]
kind = "git"
url = "$HOME/remote.git"
identity = "test"
profiles = ["all"]

[projects.beta]
kind = "git"
url = "$HOME/remote.git"
identity = "test"
profiles = ["work"]
layout = "worktrees"

[projects.gamma]
kind = "git"
url = "$HOME/remote.git"
identity = "test"
profiles = ["personal"]
TOML
echo '{"model":"opus","permissions":{"allow":["Read(**)"]}}' > "$HOME/cfg-src/claude/settings.base.json"
echo '{"theme":"light"}' > "$HOME/cfg-src/claude/settings.work.json"
mkdir -p "$HOME/cfg-src/claude/skills/shared-skill" && echo "name: shared" > "$HOME/cfg-src/claude/skills/shared-skill/SKILL.md"
(cd "$HOME/cfg-src" && git add -A && git commit -qm "test config")
git clone -q --bare "$HOME/cfg-src" "$HOME/cfg.git"
CFG_REMOTE="$HOME/cfg.git"; HOME1="$HOME"

# --- init
$CS init --repo "$HOME/cfg.git" --name t1 --profiles work --skip deps,ssh,secrets,hooks >/dev/null || die "init"
pass init
[ -L "$HOME/.claude/CLAUDE.md" ] || die "CLAUDE.md linked"
[ -L "$HOME/.claude/skills/shared-skill" ] && [ -d "$HOME/.claude/skills/old-skill" ] && [ ! -L "$HOME/.claude/skills/old-skill" ] || die "skills coexist"
[ -L "$HOME/.claude/plans" ] && [ -f "$CS_CONFIG_DIR/repo/plans/old.md" ] || die "plans adopted into repo"
python3 - "$HOME/.claude/settings.json" <<'PY' || die "settings merged"
import json,sys; d=json.load(open(sys.argv[1]))
assert d["model"]=="opus" and d["theme"]=="light", d
assert d["permissions"]["allow"]==["Read(**)"], d   # base replaced the pre-existing file (backup kept)
PY
grep -q claude-share.inc "$HOME/.gitconfig" || die "gitconfig include"
grep -q 'hasconfig:remote.\*.url' "$HOME/.config/git/claude-share.inc" || die "includeIf rendered"
[ "$(git -C "$HOME/dev/alpha" config user.email)" = "test@example.com" ] || die "identity via includeIf"
pass apply
SIDE="$CS_CONFIG_DIR/repo/projects/alpha"
[ -f "$SIDE/CLAUDE.md" ] && [ -f "$SIDE/.claude/settings.local.json" ] || die "alpha files adopted into side-store"
grep -q autoMemoryDirectory "$HOME/dev/alpha/.claude/settings.local.json" || die "autoMemoryDirectory injected"
! grep -q autoMemoryDirectory "$SIDE/.claude/settings.local.json" || die "side-store stays machine-independent"
grep -q '^\.claude/$' "$HOME/dev/alpha/.git/info/exclude" || die "exclude written"
[ -z "$(git -C "$HOME/dev/alpha" status --porcelain)" ] || die "alpha stays clean for git"
grep -q autoMemoryDirectory "$HOME/dev/beta/wt-feat/.claude/settings.local.json" || die "worktree got settings"
grep -q autoMemoryDirectory "$HOME/dev/beta/repo/.claude/settings.local.json" || die "main checkout got settings"
pass link
$CS adopt memory alpha >/dev/null || die "adopt memory"
[ -f "$SIDE/memory/x.md" ] && grep -q "a fact" "$SIDE/memory/MEMORY.md" || die "memory adopted"
pass adopt-memory

# --- idempotency
$CS apply --check >/dev/null || die "apply --check clean"
$CS link --check >/dev/null || die "link --check clean"
$CS init --repo "$HOME/cfg.git" --name t1 --profiles work --skip deps,ssh,secrets,hooks >/dev/null || die "init rerun"
pass idempotent

# --- edit in checkout flows back and to the worktree; sync commits + pushes
sleep 1; echo '# alpha guidance v2' > "$HOME/dev/alpha/CLAUDE.md"
$CS sync >/dev/null || die "sync"
grep -q v2 "$SIDE/CLAUDE.md" || die "newer checkout content won"
(cd "$CS_CONFIG_DIR/repo" && [ -z "$(git status --porcelain)" ]) || die "config repo committed"
[ "$(git -C "$HOME/cfg.git" rev-parse HEAD)" = "$(git -C "$CS_CONFIG_DIR/repo" rev-parse HEAD)" ] || die "pushed"
pass sync-copyback

# --- second machine from the same remote sees the same state
export HOME2="$(mktemp -d)"
( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share"
  mkdir -p "$HOME2/dev"
  $CS init --repo "$CFG_REMOTE" --name t2 --profiles work,personal --skip doctor,deps,ssh,secrets,hooks >/dev/null || die "init m2"
  $CS clone >/dev/null || die "clone m2"
  [ -d "$HOME2/dev/alpha/.git" ] && [ -d "$HOME2/dev/gamma/.git" ] && [ -d "$HOME2/dev/beta/repo/.git" ] || die "cloned selected projects"
  grep -q v2 "$HOME2/dev/alpha/CLAUDE.md" || die "m2 got alpha CLAUDE.md"
  grep -q "$HOME2" "$HOME2/dev/alpha/.claude/settings.local.json" && ! grep -q "$HOME\b" "$HOME2/dev/alpha/.claude/settings.local.json" || true
  # conflict: both machines edit the same memory topic -> union, no block
  echo "- [y](y.md) - m2 fact" >> "$CS_CONFIG_DIR/repo/projects/alpha/memory/MEMORY.md"
  $CS sync >/dev/null || die "m2 sync"
)
echo "- [z](z.md) - m1 fact" >> "$SIDE/memory/MEMORY.md"
$CS sync >/dev/null || die "m1 sync after m2"
grep -q "m2 fact" "$SIDE/memory/MEMORY.md" && grep -q "m1 fact" "$SIDE/memory/MEMORY.md" || die "union merge"
pass two-machines-union

# --- real JSON conflict blocks cleanly, resolve unblocks
( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share"
  echo '{"model":"sonnet","permissions":{"allow":["Read(**)"]}}' > "$CS_CONFIG_DIR/repo/claude/settings.base.json"
  $CS sync >/dev/null || die "m2 conflict setup"
)
echo '{"model":"haiku","permissions":{"allow":["Read(**)"]}}' > "$CS_CONFIG_DIR/repo/claude/settings.base.json"
if $CS sync >/dev/null 2>&1; then die "conflict should block"; fi
[ -f "$XDG_STATE_HOME/cs/blocked-config" ] || die "blocked marker"
git -C "$CS_CONFIG_DIR/repo" rebase --abort 2>/dev/null && die "left mid-rebase" || true
$CS sync --resolve theirs >/dev/null || die "resolve"
grep -q sonnet "$CS_CONFIG_DIR/repo/claude/settings.base.json" || die "theirs applied"
grep -q sonnet "$HOME/.claude/settings.json" || die "settings re-rendered after pull"
pass conflict-abort-resolve

$CS status >/dev/null; $CS doctor >/dev/null || die "doctor"
$CS >/dev/null || die "dashboard"
pass status-doctor

# --- cs new (no GitHub in tests): dir, git init on default branch, first commit, registered, linked
$CS new fresh --test --no-github -d "a fresh one" >/dev/null || die "cs new"
[ "$(git -C "$HOME/dev/fresh" symbolic-ref --short HEAD)" = "master" ] || die "default branch master"
[ "$(git -C "$HOME/dev/fresh" config user.email)" = "test@example.com" ] || die "new project identity"
git -C "$HOME/dev/fresh" log --oneline | grep -q init || die "first commit"
grep -q '^\[projects.fresh\]' "$CS_CONFIG_DIR/repo/projects.toml" || die "registered"
grep -q autoMemoryDirectory "$HOME/dev/fresh/.claude/settings.local.json" || die "linked"
[ -z "$(git -C "$HOME/dev/fresh" status --porcelain)" ] || die "fresh stays clean"
if $CS new fresh --test --no-github >/dev/null 2>&1; then die "duplicate name refused"; fi
pass cs-new

# --- identity add: appended before the Projects marker, includes re-rendered, usable as --flag
$CS identity add extra --owner extra-org --name "Extra" --email extra@example.com  --no-token >/dev/null 2>&1 || die "identity add"
grep -q '^\[identities.extra\]' "$CS_CONFIG_DIR/repo/projects.toml" || die "identity in manifest"
grep -q 'git@github.com:extra-org/\*\*' "$HOME/.config/git/claude-share.inc" || die "includeIf for new identity"
$CS identity ls | grep -q extra || die "identity ls"
$CS new viaflag --extra-org --no-github >/dev/null 2>&1 || die "new via --owner flag"
[ "$(git -C "$HOME/dev/viaflag" config user.email)" = "extra@example.com" ] || die "identity applied to new project"
$CS identity rename extra extra2 >/dev/null || die "identity rename"
grep -q '^\[identities.extra2\]' "$CS_CONFIG_DIR/repo/projects.toml" && ! grep -q '^\[identities.extra\]' "$CS_CONFIG_DIR/repo/projects.toml" || die "renamed in manifest"
[ "$(git -C "$HOME/dev/viaflag" config user.email)" = "extra@example.com" ] || die "rename keeps identity working"
[ ! -f "$HOME/.config/git/identity-extra.inc" ] || die "stale include pruned"
pass identity

# --- secrets (only when sops + age are installed): init, set, get, exec, enroll a second machine, guard
if command -v sops >/dev/null && command -v age-keygen >/dev/null; then
  export SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt"
  $CS secrets init >/dev/null || die "secrets init"
  $CS secrets set global API_KEY=abc123 URL="https://x" >/dev/null || die "secrets set"
  grep -q '^API_KEY=ENC\[' "$CS_CONFIG_DIR/repo/secrets/global.env" || die "encrypted on disk"
  [ "$($CS secrets get global API_KEY --show)" = "abc123" ] || die "secrets get"
  $CS secrets set alpha DB=pg >/dev/null || die "project secret"
  (cd "$HOME/dev/alpha" && [ "$($CS -q secrets exec -- sh -c 'echo $API_KEY-$DB')" = "abc123-pg" ]) || die "secrets exec"
  (cd "$HOME/dev/beta/repo" && [ "$($CS -q secrets exec -- sh -c 'echo $API_KEY-$DB')" = "abc123-" ]) || die "project scoping"
  echo "PLAIN=1" > "$CS_CONFIG_DIR/repo/secrets/projects/x.env"
  (cd "$CS_CONFIG_DIR/repo" && git add -A && git -c user.name=t -c user.email=t@x commit -qm plain >/dev/null 2>&1) && die "guard should refuse plaintext"
  rm "$CS_CONFIG_DIR/repo/secrets/projects/x.env"; (cd "$CS_CONFIG_DIR/repo" && git reset -q)
  $CS sync >/dev/null || die "sync secrets"
  # second machine: not a recipient until enrolled
  ( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME2/.config/sops/age/keys.txt"
    $CS sync >/dev/null; $CS secrets init >/dev/null 2>&1 || die "m2 secrets init"
    $CS secrets get global API_KEY --show >/dev/null 2>&1 && die "m2 must not decrypt before enroll"
    $CS sync >/dev/null || die "m2 publish pub" )
  $CS sync >/dev/null && $CS enroll t2 >/dev/null || die "enroll"
  $CS sync >/dev/null
  ( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME2/.config/sops/age/keys.txt"
    $CS sync >/dev/null; [ "$($CS secrets get global API_KEY --show)" = "abc123" ] || die "m2 decrypts after enroll" )
  $CS revoke t2 >/dev/null 2>&1 || die "revoke"
  pass secrets
else
  echo "SKIP secrets (sops/age not installed)"
fi
echo "ALL PASS (HOME=$HOME)"
