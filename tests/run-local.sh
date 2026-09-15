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
# a skill installed by skills.sh (`npx skills add … -g`): real files in ~/.agents/skills, relative link from ~/.claude/skills
mkdir -p "$HOME/.agents/skills/sh-skill" && echo "name: sh" > "$HOME/.agents/skills/sh-skill/SKILL.md"
echo '{"skills":{"sh-skill":{"source":"x/y"}}}' > "$HOME/.agents/.skill-lock.json"
ln -s ../../.agents/skills/sh-skill "$HOME/.claude/skills/sh-skill"

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
[ -L "$HOME/.agents/skills" ] && [ "$(readlink -f "$HOME/.agents/skills")" = "$(readlink -f "$CS_CONFIG_DIR/repo/claude/skills")" ] || die "~/.agents/skills is the repo skills dir"
[ -f "$CS_CONFIG_DIR/repo/claude/skills/sh-skill/SKILL.md" ] && [ -f "$HOME/.claude/skills/sh-skill/SKILL.md" ] || die "skills.sh skill adopted into repo"
[ -L "$HOME/.agents/.skill-lock.json" ] && grep -q sh-skill "$CS_CONFIG_DIR/repo/claude/skill-lock.json" || die "skill lock adopted into repo"
$CS apply --check | grep -q "up to date" || die "apply idempotent after skills adoption"
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
  # recovery key: generated here, used on the revoked machine to enroll itself through the wizard
  RKEY="$($CS secrets recovery 2>/dev/null | grep -o 'AGE-SECRET-KEY-1[A-Z0-9]*' | head -1)"; [ -n "$RKEY" ] || die "recovery key printed"
  $CS sync >/dev/null || die "sync recovery"
  ( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME2/.config/sops/age/keys.txt"
    $CS sync >/dev/null 2>&1 || true
    $CS secrets get global API_KEY --show >/dev/null 2>&1 && die "m2 must be revoked"
    CS_ANSWERS='["n","recovery","'"$RKEY"'","n"]' $CS init --skip deps,ssh,hooks,doctor,apply,link > "$HOME2/recovery.log" 2>&1 || { tail -15 "$HOME2/recovery.log"; die "wizard recovery enroll"; }
    [ "$($CS secrets get global API_KEY --show)" = "abc123" ] || die "m2 decrypts after recovery enroll"
    [ ! -f "$HOME2/.cache/cs-recovery-"* ] 2>/dev/null || true )
  pass secrets
else
  echo "SKIP secrets (sops/age not installed)"
fi
# --- wizard: create a new share against a local bare repo, then join it from another machine
export HOME3="$(mktemp -d)"
git init -q --bare "$HOME3/share.git"
( export HOME="$HOME3" CLAUDE_CONFIG_DIR="$HOME3/.claude" XDG_STATE_HOME="$HOME3/.local/state" CS_CONFIG_DIR="$HOME3/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME3/.config/sops/age/keys.txt"
  mkdir -p "$HOME3/dev"
  #        choose  name        url               machine  profiles  id        owner    name  email
  #            choose    name         url                machine  profiles   workspace(select,text)  id       owner      name        email               keys
  CS_ANSWERS='["wiz1","create","<default>","'"$HOME3"'/share.git","personal","custom","~/code","personal","someone","Some One","some@example.com","skip","n"]' \
    $CS init --skip deps,hooks,doctor >/dev/null || die "wizard create"
  grep -q 'workspace = "~/code"' "$CS_CONFIG_DIR/machine.toml" || die "custom workspace saved"
  [ -f "$HOME3/.ssh/cs/master" ] || die "master key generated"
  [ "$(git -C "$CS_CONFIG_DIR/repo" config core.sshCommand)" = "ssh -i ~/.ssh/cs/master -o IdentitiesOnly=yes" ] || die "config repo pinned to master key"
  grep -q '^\[identities.personal\]' "$CS_CONFIG_DIR/repo/projects.toml" || die "first identity"
  [ -f "$HOME3/.ssh/cs/personal" ] || die "identity key generated"
  [ -f "$CS_CONFIG_DIR/repo/machines/wiz1/ssh/personal.pub" ] || die "pubkey published"
  [ -L "$HOME3/.claude/CLAUDE.md" ] || die "applied"
  git -C "$HOME3/share.git" log --oneline | grep -q "skeleton" || die "pushed to share" )
export HOME4="$(mktemp -d)"
( export HOME="$HOME4" CLAUDE_CONFIG_DIR="$HOME4/.claude" XDG_STATE_HOME="$HOME4/.local/state" CS_CONFIG_DIR="$HOME4/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME4/.config/sops/age/keys.txt"
  mkdir -p "$HOME4/dev"
  #        choose  url               machine  profiles  (ssh keys: skip)  (token: n)
  #            choose  url                machine  profiles   workspace   keys  token
  CS_ANSWERS='["wiz2","join","'"$HOME3"'/share.git","personal","default","skip","n","skip"]' \
    $CS init --skip deps,hooks,doctor >/dev/null || die "wizard join"
  grep -q '^\[identities.personal\]' "$CS_CONFIG_DIR/repo/projects.toml" || die "joined share has identity"
  [ -f "$HOME4/.ssh/cs/master" ] && [ -f "$HOME4/.ssh/cs/personal" ] || die "join generated keys"
  [ -f "$CS_CONFIG_DIR/repo/machines/wiz2/ssh/personal.pub" ] && [ -f "$CS_CONFIG_DIR/repo/machines/wiz1/ssh/personal.pub" ] || die "both machines published"
  [ "$(grep -c . "$CS_CONFIG_DIR/machine.toml")" -gt 2 ] || die "machine.toml" )
pass wizard

# --- project picker: join the first share interactively, select only alpha + gamma → profiles/exclude derived, only their identity set up
export HOME5="$(mktemp -d)"
( export HOME="$HOME5" CLAUDE_CONFIG_DIR="$HOME5/.claude" XDG_STATE_HOME="$HOME5/.local/state" CS_CONFIG_DIR="$HOME5/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME5/.config/sops/age/keys.txt"
  mkdir -p "$HOME5/dev"
  #            choose  url             machine  projects        workspace  keys token clone
  CS_ANSWERS='["wiz3","join","'"$CFG_REMOTE"'","alpha,gamma","done","default","skip","n","n"]' $CS init --skip deps,hooks,doctor,secrets >/dev/null || die "picker init"
  grep -q 'profiles = \[ "personal" \]' "$CS_CONFIG_DIR/machine.toml" || die "profiles derived from picked projects"
  ($CS status --all || true) | grep -q "beta.*skipped" || die "beta not selected"
  ($CS status || true) | grep -q "gamma" || die "gamma listed"
  ($CS status || true) | grep -q " beta " && die "beta must not be listed" || true )
pass project-picker

# --- M2: handoff / resume between machine 1 (HOME1) and machine 2 (HOME2), same bare remote
m1() { ( export HOME="$HOME1" CLAUDE_CONFIG_DIR="$HOME1/.claude" XDG_STATE_HOME="$HOME1/.local/state" CS_CONFIG_DIR="$HOME1/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME1/.config/sops/age/keys.txt"; "$@" ); }
m2() { ( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME2/.config/sops/age/keys.txt"; "$@" ); }
A1="$HOME1/dev/alpha"; A2="$HOME2/dev/alpha"
git -C "$A1" config user.name "Test User"; git -C "$A2" config user.name "Test User"
# dirty state on machine 1: modified tracked, new untracked, gitignored (must not travel), handoff.extra (must travel)
printf 'build/\nlocal.conf\n' > "$A1/.gitignore"; (cd "$A1" && git add .gitignore && git -c user.email=t@x -c user.name=t commit -qm gitignore && git push -q origin HEAD)
(cd "$A2" && git pull -q)
echo "changed" >> "$A1/README"; echo "new file" > "$A1/notes.txt"; mkdir -p "$A1/build" && echo "junk" > "$A1/build/out"; echo "keep me" > "$A1/local.conf"
cat >> "$CS_CONFIG_DIR/repo/projects.toml" <<TOML

[projects.alpha.handoff]
extra = ["local.conf"]
TOML
(cd "$CS_CONFIG_DIR/repo" && git add -A && git -c user.name=t -c user.email=t@x commit -qm "alpha handoff extra" >/dev/null)
m1 $CS sync >/dev/null
BEFORE="$(cd "$A1" && git status --porcelain)"
(cd "$A1" && m1 $CS handoff -m "continue with the notes" >/dev/null) || die "handoff"
[ "$(cd "$A1" && git status --porcelain)" = "$BEFORE" ] || die "sender tree untouched"
[ -z "$(cd "$A1" && git diff --cached)" ] || die "sender index untouched"
git -C "$HOME/remote.git" show-ref | grep -q "wip/test-user/main" || die "wip branch pushed"
! git -C "$HOME/remote.git" ls-tree -r --name-only "wip/test-user/main" | grep -q "build/out" || die "gitignored file must not travel"
git -C "$HOME/remote.git" ls-tree -r --name-only "wip/test-user/main" | grep -q "local.conf" || die "handoff.extra travels"
# lease: a second machine cannot overwrite a parcel from another machine without --overwrite
echo "m2 change" >> "$A2/README"
(cd "$A2" && m2 $CS handoff >/dev/null 2>&1) && die "lease should refuse" || true
(cd "$A2" && git checkout -q -- README)
# resume on machine 2
(cd "$A2" && m2 $CS sync >/dev/null; m2 $CS resume >/dev/null) || die "resume"
[ "$(cd "$A2" && git status --porcelain | sort)" = "$(echo "$BEFORE" | sort)" ] || die "identical dirty tree on receiver"
grep -q "changed" "$A2/README" && [ "$(cat "$A2/notes.txt")" = "new file" ] && [ "$(cat "$A2/local.conf")" = "keep me" ] || die "contents restored"
[ ! -d "$A2/.cs-handoff" ] || die "sidecar removed"
! git -C "$HOME/remote.git" show-ref | grep -q "wip/test-user/main" || die "wip branch deleted after resume"
[ "$(cd "$A2" && m2 $CS note --print | tail -1)" = "continue with the notes" ] || die "note printed"
(cd "$A2" && m2 $CS note --print >/dev/null 2>&1) && die "note printed only once" || true
# worktree layout: hand off from wt-feat on machine 1, resume on machine 2 where the worktree does not exist
B1="$HOME1/dev/beta"; B2="$HOME2/dev/beta"
git -C "$B1/repo" config user.name "Test User"; git -C "$B2/repo" config user.name "Test User"
echo "feat work" > "$B1/wt-feat/feat.txt"
(cd "$B1/wt-feat" && m1 $CS handoff >/dev/null) || die "handoff from worktree"
(cd "$B2/repo" && m2 $CS resume >/dev/null) || die "resume into new worktree"
[ -d "$B2/wt-feat" ] && [ "$(cat "$B2/wt-feat/feat.txt")" = "feat work" ] && [ "$(git -C "$B2/wt-feat" symbolic-ref --short HEAD)" = "feat" ] || die "worktree created with parcel"
# deny list
echo "sk-123" > "$A1/api.key"
(cd "$A1" && m1 $CS handoff >/dev/null 2>&1) && die "deny list should abort" || true
rm "$A1/api.key"
# --replace keeps a backup ref
(cd "$A1" && m1 $CS handoff -m "again" >/dev/null) || die "handoff again"
echo "conflicting local edit" > "$A2/notes.txt"
(cd "$A2" && m2 $CS resume >/dev/null 2>&1) && die "dirty target should refuse" || true
(cd "$A2" && m2 $CS resume --replace >/dev/null) || die "resume --replace"
git -C "$A2" for-each-ref refs/cs/backup | grep -q backup || die "backup ref kept"
[ "$(cat "$A2/notes.txt")" = "new file" ] || die "parcel applied over local edit"
pass handoff-resume

echo "ALL PASS (HOME=$HOME)"
