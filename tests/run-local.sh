#!/usr/bin/env bash
# End-to-end check in a throwaway HOME: share skeleton -> init -> idempotency -> link/import/sync.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export HOME="$(mktemp -d)"
export CLAUDE_CONFIG_DIR="$HOME/.claude"
export XDG_STATE_HOME="$HOME/.local/state"
export CS_CONFIG_DIR="$HOME/.config/claude-share"
export CS_FAKE_GITHUB="$HOME/gh"   # "GitHub" is a directory of bare repos: <owner>/<name>.git
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

# --- share skeleton + bare remote for it
$CS share new "$HOME/cfg-src" >/dev/null
cat >> "$HOME/cfg-src/projects.toml" <<TOML

[identities.test]
name = "Test User"
email = "test@example.com"
owner = "test"
url_globs = ["$HOME/remote.git", "$HOME/remote.git/**"]

[projects.alpha]
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
[ -f "$CS_CONFIG_DIR/repo/claude/skills/sh-skill/SKILL.md" ] && [ -f "$HOME/.claude/skills/sh-skill/SKILL.md" ] || die "skills.sh skill imported into the share"
[ -L "$HOME/.agents/.skill-lock.json" ] && grep -q sh-skill "$CS_CONFIG_DIR/repo/claude/skill-lock.json" || die "skill lock imported into the share"
$CS apply --check | grep -q "up to date" || die "apply idempotent after skills import"
[ -L "$HOME/.claude/plans" ] && [ -f "$CS_CONFIG_DIR/repo/plans/old.md" ] || die "plans imported into the share"
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
[ -f "$SIDE/CLAUDE.md" ] && [ -f "$SIDE/.claude/settings.local.json" ] || die "alpha files imported into project state"
grep -q autoMemoryDirectory "$HOME/dev/alpha/.claude/settings.local.json" || die "autoMemoryDirectory injected"
! grep -q autoMemoryDirectory "$SIDE/.claude/settings.local.json" || die "project state stays machine-independent"
grep -q '^\.claude/$' "$HOME/dev/alpha/.git/info/exclude" || die "exclude written"
[ -z "$(git -C "$HOME/dev/alpha" status --porcelain)" ] || die "alpha stays clean for git"
grep -q autoMemoryDirectory "$HOME/dev/beta/wt-feat/.claude/settings.local.json" || die "worktree got settings"
grep -q autoMemoryDirectory "$HOME/dev/beta/repo/.claude/settings.local.json" || die "main checkout got settings"
pass link
$CS import memory alpha >/dev/null || die "import memory"
[ -f "$SIDE/memory/x.md" ] && grep -q "a fact" "$SIDE/memory/MEMORY.md" || die "memory imported"
pass import-memory

# --- idempotency
$CS apply --check >/dev/null || die "apply --check clean"
$CS link --check >/dev/null || die "link --check clean"
$CS init --repo "$HOME/cfg.git" --name t1 --profiles work --skip deps,ssh,secrets,hooks >/dev/null || die "init rerun"
pass idempotent

# --- edit in checkout flows back and to the worktree; sync commits + pushes
sleep 1; echo '# alpha guidance v2' > "$HOME/dev/alpha/CLAUDE.md"
$CS share-sync >/dev/null || die "sync"
grep -q v2 "$SIDE/CLAUDE.md" || die "newer checkout content won"
(cd "$CS_CONFIG_DIR/repo" && [ -z "$(git status --porcelain)" ]) || die "share committed"
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
  $CS share-sync >/dev/null || die "m2 sync"
)
echo "- [z](z.md) - m1 fact" >> "$SIDE/memory/MEMORY.md"
$CS share-sync >/dev/null || die "m1 sync after m2"
grep -q "m2 fact" "$SIDE/memory/MEMORY.md" && grep -q "m1 fact" "$SIDE/memory/MEMORY.md" || die "union merge"
pass two-machines-union

# --- a real (non-union) conflict through share-sync, what hooks and the timer run: settled newest-wins per file, pushed, no marker, never mid-rebase
# two local commits touch the file: the rebase stops twice on it and both stops are settled
echo '{"model":"haiku","permissions":{"allow":["Read(**)"]}}' > "$CS_CONFIG_DIR/repo/claude/settings.base.json"
(cd "$CS_CONFIG_DIR/repo" && git add -A && git commit -qm "m1 older")
echo '{"model":"haiku","permissions":{"allow":["Read(**)","Bash(ls *)"]}}' > "$CS_CONFIG_DIR/repo/claude/settings.base.json"
(cd "$CS_CONFIG_DIR/repo" && git add -A && git commit -qm "m1 older, again") ; sleep 1
( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share"
  echo '{"model":"sonnet","permissions":{"allow":["Read(**)"]}}' > "$CS_CONFIG_DIR/repo/claude/settings.base.json"
  $CS share-sync >/dev/null || die "m2 conflict setup"
)
$CS share-sync > "$HOME/share-conflict.log" 2>&1 || { cat "$HOME/share-conflict.log"; die "share-sync must settle the conflict itself"; }
grep -q sonnet "$CS_CONFIG_DIR/repo/claude/settings.base.json" || die "newest (m2) won"
grep -q "settled claude/settings.base.json (the other machine), claude/settings.base.json (the other machine)" "$HOME/share-conflict.log" || die "settled line names the file and the side, once per stop"
[ ! -f "$XDG_STATE_HOME/cs/blocked-config" ] || die "no blocked marker"
[ ! -d "$CS_CONFIG_DIR/repo/.git/rebase-merge" ] && [ ! -d "$CS_CONFIG_DIR/repo/.git/rebase-apply" ] || die "left mid-rebase"
[ "$(git -C "$HOME/cfg.git" rev-parse HEAD)" = "$(git -C "$CS_CONFIG_DIR/repo" rev-parse HEAD)" ] || die "pushed after settling"
BK="$(git -C "$CS_CONFIG_DIR/repo" for-each-ref --format='%(refname)' refs/cs/backup/share | head -1)"
[ -n "$BK" ] && git -C "$CS_CONFIG_DIR/repo" show "$BK:claude/settings.base.json" | grep -q haiku || die "this machine's commits kept in a backup ref with the losing version"
grep -q sonnet "$HOME/.claude/settings.json" || die "settings re-rendered after pull"
# --resolve ours overrides newest-wins (m1 newer this time would also win; make m2 newer again and keep ours)
echo '{"model":"opus","permissions":{"allow":["Read(**)"]}}' > "$CS_CONFIG_DIR/repo/claude/settings.base.json"
(cd "$CS_CONFIG_DIR/repo" && git add -A && git commit -qm "m1 older again") ; sleep 1
( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share"
  $CS share-sync >/dev/null || die "m2 pull"
  echo '{"model":"sonnet","permissions":{"allow":["Read(**)","Edit(**)"]}}' > "$CS_CONFIG_DIR/repo/claude/settings.base.json"
  $CS share-sync >/dev/null || die "m2 conflict setup 2"
)
$CS share-sync --resolve ours >/dev/null 2>&1 || die "share-sync --resolve ours"
grep -q opus "$CS_CONFIG_DIR/repo/claude/settings.base.json" || die "--resolve ours kept this machine's version"
[ "$(git -C "$HOME/cfg.git" rev-parse HEAD)" = "$(git -C "$CS_CONFIG_DIR/repo" rev-parse HEAD)" ] || die "pushed after --resolve ours"
pass share-sync-newest-wins

# --- every project has a remote (ADR-0001): a registered project without one and an unregistered dir are flagged with the fixing command
printf '\n[projects.orphan]\nprofiles = ["all"]\n' >> "$CS_CONFIG_DIR/repo/projects.toml"; (cd "$CS_CONFIG_DIR/repo" && git add -A && git commit -qm "orphan: registered before it had a remote")
mkdir -p "$HOME/dev/orphan" && (cd "$HOME/dev/orphan" && git init -q -b master && echo x > f && git add f && git commit -qm init)
($CS status || true) | grep -q "orphan.*no remote.*cs doctor --fix" || die "status flags the remote-less project"
($CS status || true) | grep -q "notes: not registered, no remote.*cs add" || die "status flags the unregistered dir"
($CS doctor || true) | grep -q "orphan: no remote" || die "doctor flags the remote-less project"
$CS doctor >/dev/null && die "doctor must fail while a project has no remote" || true
$CS >/dev/null 2>&1 || true
#            orphan: create repo? y   notes: register? n
CS_ANSWERS='["y","n"]' $CS doctor --fix >/dev/null || die "doctor --fix"
[ -d "$HOME/gh/test/orphan.git" ] || die "doctor --fix created the (fake) GitHub repo"
[ "$(git -C "$HOME/dev/orphan" remote get-url origin)" = "$HOME/gh/test/orphan.git" ] || die "origin added"
git -C "$HOME/gh/test/orphan.git" log --oneline | grep -q init || die "pushed"
grep -A3 '^\[projects.orphan\]' "$CS_CONFIG_DIR/repo/projects.toml" | grep -q 'url = ' || die "manifest url recorded"
($CS doctor || true) | grep -q "orphan" && die "orphan must be clean after --fix" || true
# cs add on a directory without a remote: same ensure-remote step
mkdir -p "$HOME/dev/notes" && (cd "$HOME/dev/notes" && git init -q -b master && echo n > n.md && git add n.md && git commit -qm notes)
$CS add "$HOME/dev/notes" >/dev/null || die "cs add remote-less"
[ -d "$HOME/gh/test/notes.git" ] && grep -q '^\[projects.notes\]' "$CS_CONFIG_DIR/repo/projects.toml" || die "cs add created the repo and registered"
# cs add on a directory that already has a remote: registered as is, identity inferred from the url
git clone -q "$HOME/remote.git" "$HOME/dev/delta" && $CS add "$HOME/dev/delta" >/dev/null || die "cs add with remote"
grep -A3 '^\[projects.delta\]' "$CS_CONFIG_DIR/repo/projects.toml" | grep -q 'identity = "test"' || die "identity inferred"
$CS doctor >/dev/null || die "doctor clean"
pass status-doctor

# --- hooks are written with cs share-sync; an old-style `cs sync …` hook command is replaced on re-install
python3 - "$CS_CONFIG_DIR/repo/claude/settings.base.json" <<'PY'
import json,sys; f=sys.argv[1]; d=json.load(open(f))
d["hooks"]={"Stop":[{"hooks":[{"type":"command","command":"command -v cs >/dev/null 2>&1 && cs sync --push-only --quiet || true"}]}]}
json.dump(d,open(f,"w"))
PY
(cd "$CS_CONFIG_DIR/repo" && git add -A && git commit -qm "old hooks")
$CS hooks install --no-timer >/dev/null || die "hooks install"
grep -q 'cs share-sync --push-only' "$CS_CONFIG_DIR/repo/claude/settings.base.json" && ! grep -q 'cs sync --push-only' "$CS_CONFIG_DIR/repo/claude/settings.base.json" || die "old hook command replaced"
grep -q 'cs share-sync --pull-only.*cs note --print' "$CS_CONFIG_DIR/repo/claude/settings.base.json" || die "session-start hook prints the handoff note"
grep -q 'cs handoff --mark' "$CS_CONFIG_DIR/repo/claude/settings.base.json" || die "session-end hook marks dirty work"
pass hooks

# --- command surface: --help shows exactly the visible tier; hidden commands still run
VISIBLE="$($CS --help | sed -n '/^Commands:/,/^$/p' | grep -E '^  [a-z]' | awk '{print $1}' | tr '\n' ' ')"
[ "$VISIBLE" = "sync new add clone secrets identity trust doctor update init help " ] || die "visible tier: $VISIBLE"
SEC="$($CS secrets --help | sed -n '/^Commands:/,/^$/p' | grep -E '^  [a-z]' | awk '{print $1}' | tr '\n' ' ')"
[ "$SEC" = "set get edit help " ] || die "secrets visible tier: $SEC"
$CS apply >/dev/null && $CS link >/dev/null && $CS share path >/dev/null && $CS hooks >/dev/null && $CS handoffs >/dev/null && $CS status >/dev/null || die "hidden commands callable"
($CS doctor || true) | grep -q "hooks installed" || die "doctor reports hooks"
($CS doctor || true) | grep -q "timer" || die "doctor reports the timer"
($CS doctor || true) | grep -q "last share sync" || die "doctor reports the last share sync"
pass help-tiers

# --- cs new (fake GitHub): dir, git init on default branch, first commit, repo created, pushed, registered, linked
$CS new fresh --test -d "a fresh one" >/dev/null || die "cs new"
[ -d "$HOME/gh/test/fresh.git" ] && git -C "$HOME/gh/test/fresh.git" log --oneline | grep -q init || die "repo created and pushed"
[ "$(git -C "$HOME/dev/fresh" symbolic-ref --short HEAD)" = "master" ] || die "default branch master"
[ "$(git -C "$HOME/dev/fresh" config user.email)" = "test@example.com" ] || die "new project identity"
git -C "$HOME/dev/fresh" log --oneline | grep -q init || die "first commit"
grep -q '^\[projects.fresh\]' "$CS_CONFIG_DIR/repo/projects.toml" || die "registered"
grep -q autoMemoryDirectory "$HOME/dev/fresh/.claude/settings.local.json" || die "linked"
[ -z "$(git -C "$HOME/dev/fresh" status --porcelain)" ] || die "fresh stays clean"
if $CS new fresh --test >/dev/null 2>&1; then die "duplicate name refused"; fi
pass cs-new

# --- identity add: appended before the Projects marker, includes re-rendered, usable as --flag
$CS identity add extra --owner extra-org --name "Extra" --email extra@example.com  --no-token >/dev/null 2>&1 || die "identity add"
grep -q '^\[identities.extra\]' "$CS_CONFIG_DIR/repo/projects.toml" || die "identity in manifest"
grep -q 'git@github.com:extra-org/\*\*' "$HOME/.config/git/claude-share.inc" || die "includeIf for new identity"
$CS identity ls | grep -q extra || die "identity ls"
$CS new viaflag --extra-org >/dev/null 2>&1 || die "new via --owner flag"
[ "$(git -C "$HOME/dev/viaflag" config user.email)" = "extra@example.com" ] || die "identity applied to new project"
$CS identity rename extra extra2 >/dev/null || die "identity rename"
grep -q '^\[identities.extra2\]' "$CS_CONFIG_DIR/repo/projects.toml" && ! grep -q '^\[identities.extra\]' "$CS_CONFIG_DIR/repo/projects.toml" || die "renamed in manifest"
[ "$(git -C "$HOME/dev/viaflag" config user.email)" = "extra@example.com" ] || die "rename keeps identity working"
[ ! -f "$HOME/.config/git/identity-extra.inc" ] || die "stale include pruned"
pass identity

# --- secrets (only when sops + age are installed): init, set, get, exec, trust a second machine, guard
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
  $CS share-sync >/dev/null || die "sync secrets"
  # second machine: not a recipient until trusted
  ( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME2/.config/sops/age/keys.txt"
    $CS share-sync >/dev/null; $CS secrets init >/dev/null 2>&1 || die "m2 secrets init"
    $CS secrets get global API_KEY --show >/dev/null 2>&1 && die "m2 must not decrypt before trust"
    $CS share-sync >/dev/null || die "m2 publish pub" )
  $CS share-sync >/dev/null && $CS trust t2 >/dev/null || die "trust"
  $CS share-sync >/dev/null
  ( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME2/.config/sops/age/keys.txt"
    $CS share-sync >/dev/null; [ "$($CS secrets get global API_KEY --show)" = "abc123" ] || die "m2 decrypts after trust" )
  $CS untrust t2 >/dev/null 2>&1 || die "untrust"
  # recovery key: generated here, used on the untrusted machine to trust itself through the wizard
  RKEY="$($CS secrets recovery 2>/dev/null | grep -o 'AGE-SECRET-KEY-1[A-Z0-9]*' | head -1)"; [ -n "$RKEY" ] || die "recovery key printed"
  $CS share-sync >/dev/null || die "sync recovery"
  ( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME2/.config/sops/age/keys.txt"
    $CS share-sync >/dev/null 2>&1 || true
    $CS secrets get global API_KEY --show >/dev/null 2>&1 && die "m2 must be untrusted"
    CS_ANSWERS='["n","n","recovery","'"$RKEY"'","n"]' $CS init --skip deps,ssh,hooks,doctor,apply,link > "$HOME2/recovery.log" 2>&1 || { tail -15 "$HOME2/recovery.log"; die "wizard recovery trust"; }
    [ "$($CS secrets get global API_KEY --show)" = "abc123" ] || die "m2 decrypts after recovery trust"
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
  [ -f "$HOME3/.ssh/cs/master" ] || die "share key generated"
  [ "$(git -C "$CS_CONFIG_DIR/repo" config core.sshCommand)" = "ssh -i ~/.ssh/cs/master -o IdentitiesOnly=yes" ] || die "share pinned to the share key"
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
m1 $CS share-sync >/dev/null
BEFORE="$(cd "$A1" && git status --porcelain)"
(cd "$A1" && m1 $CS handoff -m "continue with the notes" >/dev/null) || die "handoff"
[ "$(cd "$A1" && git status --porcelain)" = "$BEFORE" ] || die "sender tree untouched"
[ -z "$(cd "$A1" && git diff --cached)" ] || die "sender index untouched"
git -C "$HOME/remote.git" show-ref | grep -q "wip/test-user/main" || die "handoff ref pushed"
! git -C "$HOME/remote.git" ls-tree -r --name-only "wip/test-user/main" | grep -q "build/out" || die "gitignored file must not travel"
git -C "$HOME/remote.git" ls-tree -r --name-only "wip/test-user/main" | grep -q "local.conf" || die "handoff.extra travels"
# lease: a second machine cannot overwrite a parcel from another machine without --overwrite
echo "m2 change" >> "$A2/README"
(cd "$A2" && m2 $CS handoff >/dev/null 2>&1) && die "lease should refuse" || true
(cd "$A2" && git checkout -q -- README)
# resume on machine 2
(cd "$A2" && m2 $CS share-sync >/dev/null; m2 $CS resume >/dev/null) || die "resume"
[ "$(cd "$A2" && git status --porcelain | sort)" = "$(echo "$BEFORE" | sort)" ] || die "identical dirty tree on receiver"
grep -q "changed" "$A2/README" && [ "$(cat "$A2/notes.txt")" = "new file" ] && [ "$(cat "$A2/local.conf")" = "keep me" ] || die "contents restored"
[ ! -d "$A2/.cs-handoff" ] || die "sidecar removed"
! git -C "$HOME/remote.git" show-ref | grep -q "wip/test-user/main" || die "handoff ref deleted after resume"
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

# --- cs sync: leave → arrive with one verb. Two fresh machines (desk, laptop), a fresh share, one project; nothing but cs sync is used.
S="$(mktemp -d)"
git init -q -b main "$S/one-src" && (cd "$S/one-src" && echo hello > README && git add . && git commit -qm init) && git clone -q --bare "$S/one-src" "$S/one.git"
$CS share new "$S/share-src" >/dev/null
cat >> "$S/share-src/projects.toml" <<TOML

[identities.test]
name = "Test User"
email = "test@example.com"
owner = "test"
url_globs = ["$S/*.git"]

[projects.one]
url = "$S/one.git"
identity = "test"
branch = "main"
profiles = ["all"]
TOML
(cd "$S/share-src" && git add -A && git commit -qm "share for sync") && git clone -q --bare "$S/share-src" "$S/share.git"
export HOME6="$(mktemp -d)" HOME7="$(mktemp -d)"
desk()   { ( export HOME="$HOME6" CLAUDE_CONFIG_DIR="$HOME6/.claude" XDG_STATE_HOME="$HOME6/.local/state" CS_CONFIG_DIR="$HOME6/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME6/.config/sops/age/keys.txt"; "$@" ); }
laptop() { ( export HOME="$HOME7" CLAUDE_CONFIG_DIR="$HOME7/.claude" XDG_STATE_HOME="$HOME7/.local/state" CS_CONFIG_DIR="$HOME7/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME7/.config/sops/age/keys.txt"; "$@" ); }
mkdir -p "$HOME6/dev" "$HOME7/dev"
desk   $CS init --repo "$S/share.git" --name desk   --profiles work --skip deps,ssh,secrets,hooks,doctor >/dev/null || die "desk init"
laptop $CS init --repo "$S/share.git" --name laptop --profiles work --skip deps,ssh,secrets,hooks,doctor >/dev/null || die "laptop init"
# first run on desk: nothing here yet → the missing project is cloned, hooks and timer installed, no plan screen (CS_ANSWERS=[] would throw at any prompt)
CS_ANSWERS='[]' desk $CS sync > "$HOME6/sync1.log" 2>&1 || { cat "$HOME6/sync1.log"; die "desk sync 1"; }
[ -d "$HOME6/dev/one/.git" ] || die "cs sync cloned the missing project"
grep -q "one" "$HOME6/sync1.log" && grep -q "nothing to move" "$HOME6/sync1.log" || die "sync 1 output: clone line + nothing to move"
grep -q 'cs share-sync --push-only' "$HOME6/.config/claude-share/repo/claude/settings.base.json" || die "hooks installed by self-heal"
[ -f "$HOME6/.config/systemd/user/cs-sync.timer" ] || die "timer installed by self-heal"
git -C "$HOME6/dev/one" config user.name "Test User"
# leave desk: dirty tree + a note; no CS_ANSWERS and no terminal → the plan's defaults (send) are taken
echo "changed on desk" >> "$HOME6/dev/one/README"; echo "new" > "$HOME6/dev/one/notes.txt"
BEFORE="$(git -C "$HOME6/dev/one" status --porcelain | sort)"
desk $CS sync -m "carry on with the notes" > "$HOME6/sync2.log" 2>&1 || { cat "$HOME6/sync2.log"; die "desk sync 2"; }
git -C "$S/one.git" show-ref | grep -q "wip/test-user/main" || die "handoff sent by cs sync"
[ "$(git -C "$HOME6/dev/one" status --porcelain | sort)" = "$BEFORE" ] || die "desk tree untouched after sending"
grep -q "handoffs sent" "$HOME6/sync2.log" && grep -q "1 handoff(s) sent" "$HOME6/sync2.log" || die "sync 2 output: sent + summary"
[ "$(git -C "$S/share.git" rev-parse HEAD)" = "$(git -C "$HOME6/.config/claude-share/repo" rev-parse HEAD)" ] || die "share pushed at the end of the run"
# a second concurrent cs sync is refused; a lock left by a dead process is not
echo $$ > "$HOME6/.local/state/cs/sync.lock"
desk $CS sync > "$HOME6/sync-locked.log" 2>&1 && die "concurrent sync must be refused" || true
grep -q "another cs sync is running" "$HOME6/sync-locked.log" || die "refusal message"
echo 999999 > "$HOME6/.local/state/cs/sync.lock"
CS_ANSWERS='["<default>","done"]' desk $CS sync >/dev/null 2>&1 || die "stale lock is taken over"
# arrive on laptop: one run clones the project, applies the handoff (scripted plan screen), prints the note, pushes the share
CS_ANSWERS='["<default>","done"]' laptop $CS sync > "$HOME7/sync1.log" 2>&1 || { cat "$HOME7/sync1.log"; die "laptop sync"; }
[ "$(git -C "$HOME7/dev/one" status --porcelain | sort)" = "$BEFORE" ] || die "uncommitted changes arrived on laptop"
grep -q "changed on desk" "$HOME7/dev/one/README" && [ "$(cat "$HOME7/dev/one/notes.txt")" = "new" ] || die "contents arrived"
grep -q "carry on with the notes" "$HOME7/sync1.log" || die "note shown on arrival"
grep -q "1 handoff(s) applied" "$HOME7/sync1.log" || die "laptop summary"
! git -C "$S/one.git" show-ref | grep -q "wip/test-user/main" || die "handoff deleted from the remote after applying"
(cd "$HOME7/dev/one" && laptop $CS note --print | grep -q "carry on with the notes") || die "note kept for the session-start hook"
[ "$(git -C "$S/share.git" rev-parse HEAD)" = "$(git -C "$HOME7/.config/claude-share/repo" rev-parse HEAD)" ] || die "laptop pushed the share"
# back on desk, work finished there (tree clean): nothing to do → no plan screen, "nothing to move"; the share is updated on both
(cd "$HOME6/dev/one" && git checkout -q -- . && git clean -qfd)
CS_ANSWERS='[]' desk $CS sync > "$HOME6/sync3.log" 2>&1 || { cat "$HOME6/sync3.log"; die "desk sync 3"; }
grep -q "nothing to move" "$HOME6/sync3.log" || die "nothing to move line"
[ "$(git -C "$S/share.git" rev-parse HEAD)" = "$(git -C "$HOME6/.config/claude-share/repo" rev-parse HEAD)" ] || die "share updated on both"
# self-heal: hooks, timer and a ~/.claude link removed → restored without a prompt
python3 - "$HOME6/.config/claude-share/repo/claude/settings.base.json" <<'PY'
import json,sys; f=sys.argv[1]; d=json.load(open(f)); d.pop("hooks",None); json.dump(d,open(f,"w"))
PY
(cd "$HOME6/.config/claude-share/repo" && git add -A && git commit -qm "hooks removed")
rm -f "$HOME6/.config/systemd/user/cs-sync.timer" "$HOME6/.config/systemd/user/cs-sync.service" "$HOME6/.claude/CLAUDE.md"
CS_ANSWERS='[]' desk $CS sync > "$HOME6/sync4.log" 2>&1 || { cat "$HOME6/sync4.log"; die "desk sync 4"; }
grep -q 'cs share-sync --push-only' "$HOME6/.config/claude-share/repo/claude/settings.base.json" || die "hooks restored"
[ -f "$HOME6/.config/systemd/user/cs-sync.timer" ] || die "timer restored"
[ -L "$HOME6/.claude/CLAUDE.md" ] || die "link restored"
grep -q "repaired" "$HOME6/sync4.log" && grep -q "hooks re-installed" "$HOME6/sync4.log" || die "repairs reported"
# plan screen: "Change selection" returns to the multi-select; an explicit id is honoured
echo "again" >> "$HOME6/dev/one/README"
CS_ANSWERS='["<default>","change","","done"]' desk $CS sync > "$HOME6/sync5.log" 2>&1 || { cat "$HOME6/sync5.log"; die "desk sync 5"; }
! git -C "$S/one.git" show-ref | grep -q "wip/test-user/main" || die "nothing sent when everything is unticked"
grep -q "0 of 1 actions" "$HOME6/sync5.log" || die "summary reflects the changed selection"
CS_ANSWERS='["send:one:main","done"]' desk $CS sync >/dev/null 2>&1 || die "desk sync 6"
git -C "$S/one.git" show-ref | grep -q "wip/test-user/main" || die "sent by id"
# offline: the project remote and the share unreachable → reported, local parts still run, exit 0
mv "$S/one.git" "$S/one.git.off"; mv "$S/share.git" "$S/share.git.off"
CS_ANSWERS='[]' desk $CS sync > "$HOME6/sync7.log" 2>&1 || { cat "$HOME6/sync7.log"; die "offline sync must not fail"; }
grep -q "remote unreachable" "$HOME6/sync7.log" && grep -q "offline" "$HOME6/sync7.log" || die "offline reported"
mv "$S/one.git.off" "$S/one.git"; mv "$S/share.git.off" "$S/share.git"
pass cs-sync

# --- dirty tree vs waiting handoff (#6): laptop is still dirty from the handoff it applied; desk's newer handoff (sync 6) waits for the same branch
ONE7="$HOME7/dev/one"; ONE6="$HOME6/dev/one"
L_BEFORE="$(git -C "$ONE7" status --porcelain | sort)"
# keep (the default): nothing moves, the handoff stays, the run says so; no plan screen because nothing else is planned
CS_ANSWERS='["<default>"]' laptop $CS sync > "$HOME7/q-keep.log" 2>&1 || { cat "$HOME7/q-keep.log"; die "laptop keep"; }
[ "$(git -C "$ONE7" status --porcelain | sort)" = "$L_BEFORE" ] || die "keep: tree untouched"
git -C "$S/one.git" log -1 --format=%B wip/test-user/main | grep -q "Cs-Machine: desk" || die "keep: desk's handoff still waiting"
grep -q "1 handoff(s) left waiting" "$HOME7/q-keep.log" && grep -q "kept local" "$HOME7/q-keep.log" || die "keep: reported"
[ -z "$(git -C "$ONE7" for-each-ref refs/cs/backup)" ] || die "keep: no backup ref needed"
# send mine over it: desk's handoff is kept in a backup ref here, then laptop's changes replace it on the remote; the tree stays
CS_ANSWERS='["send"]' laptop $CS sync > "$HOME7/q-send.log" 2>&1 || { cat "$HOME7/q-send.log"; die "laptop send"; }
[ "$(git -C "$ONE7" status --porcelain | sort)" = "$L_BEFORE" ] || die "send: tree untouched"
git -C "$S/one.git" log -1 --format=%B wip/test-user/main | grep -q "Cs-Machine: laptop" || die "send: laptop's handoff replaced desk's"
BK="$(git -C "$ONE7" for-each-ref --format='%(refname)' refs/cs/backup | head -1)"
[ -n "$BK" ] && git -C "$ONE7" log -1 --format=%B "$BK" | grep -q "Cs-Machine: desk" && git -C "$ONE7" show "$BK:README" | grep -q "again" || die "send: backup ref holds desk's handoff (the losing side)"
grep -q "backed up to refs/cs/backup" "$HOME7/q-send.log" && grep -q "1 handoff(s) sent" "$HOME7/q-send.log" || die "send: reported"
# apply: on desk (dirty with "again"), laptop's handoff wins; desk's changes go to a backup ref; the handoff leaves the remote
grep -q again "$ONE6/README" || die "desk still dirty"
CS_ANSWERS='["apply"]' desk $CS sync > "$HOME6/q-apply.log" 2>&1 || { cat "$HOME6/q-apply.log"; die "desk apply"; }
[ "$(git -C "$ONE6" status --porcelain | sort)" = "$L_BEFORE" ] || die "apply: laptop's changes are here now"
grep -q "changed on desk" "$ONE6/README" && ! grep -q again "$ONE6/README" && [ "$(cat "$ONE6/notes.txt")" = "new" ] || die "apply: contents are the handoff's"
BK="$(git -C "$ONE6" for-each-ref --format='%(refname)' refs/cs/backup | head -1)"
[ -n "$BK" ] && git -C "$ONE6" show "$BK:README" | grep -q again || die "apply: backup ref holds the local changes (the losing side)"
! git -C "$S/one.git" show-ref | grep -q "wip/test-user/main" || die "apply: handoff removed from the remote"
grep -q "backed up to refs/cs/backup" "$HOME6/q-apply.log" && grep -q "1 handoff(s) applied" "$HOME6/q-apply.log" || die "apply: reported"
pass dirty-vs-waiting

# --- share file changed on both machines (#6): cs sync asks per file and finishes rebased and pushed; memory *.md union-merges without a question
(cd "$ONE6" && git checkout -q -- . && git clean -qfd); (cd "$ONE7" && git checkout -q -- . && git clean -qfd)
mkdir -p "$HOME7/.config/claude-share/repo/projects/one/memory" && echo "# one" > "$HOME7/.config/claude-share/repo/projects/one/memory/MEMORY.md"
CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 || die "laptop seeds memory"
CS_ANSWERS='[]' desk $CS sync >/dev/null 2>&1 || die "desk pulls memory"
[ -f "$HOME6/.config/claude-share/repo/projects/one/memory/MEMORY.md" ] || die "memory arrived on desk"
echo '{"model":"haiku","permissions":{"allow":["Read(**)"]}}' > "$HOME6/.config/claude-share/repo/claude/settings.base.json"; echo "- desk fact" >> "$HOME6/.config/claude-share/repo/projects/one/memory/MEMORY.md"
echo '{"model":"sonnet","permissions":{"allow":["Read(**)"]}}' > "$HOME7/.config/claude-share/repo/claude/settings.base.json"; echo "- laptop fact" >> "$HOME7/.config/claude-share/repo/projects/one/memory/MEMORY.md"
CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 || die "laptop pushes its side"
# exactly one answer: the settings file; a question about MEMORY.md would exhaust the scripted answers and fail the run
CS_ANSWERS='["theirs"]' desk $CS sync > "$HOME6/share-conflict.log" 2>&1 || { cat "$HOME6/share-conflict.log"; die "desk sync with a share conflict"; }
grep -q sonnet "$HOME6/.config/claude-share/repo/claude/settings.base.json" || die "the other machine's version chosen"
grep -q "desk fact" "$HOME6/.config/claude-share/repo/projects/one/memory/MEMORY.md" && grep -q "laptop fact" "$HOME6/.config/claude-share/repo/projects/one/memory/MEMORY.md" || die "memory union-merged"
grep -q "changed on both machines" "$HOME6/share-conflict.log" && grep -q "settled claude/settings.base.json (the other machine)" "$HOME6/share-conflict.log" || die "conflict asked and settled in the same run"
[ ! -d "$HOME6/.config/claude-share/repo/.git/rebase-merge" ] || die "not mid-rebase"
[ "$(git -C "$S/share.git" rev-parse HEAD)" = "$(git -C "$HOME6/.config/claude-share/repo" rev-parse HEAD)" ] || die "share pushed after the conflict"
grep -q sonnet "$HOME6/.claude/settings.json" || die "settings re-rendered in the same run"
# no terminal, no answers: cs sync settles it newest-wins like share-sync
echo '{"model":"opus","permissions":{"allow":["Read(**)"]}}' > "$HOME6/.config/claude-share/repo/claude/settings.base.json"
(cd "$HOME6/.config/claude-share/repo" && git add -A && git commit -qm "desk older") ; sleep 1
CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 || die "laptop pulls"
echo '{"model":"haiku","permissions":{"allow":["Read(**)"]}}' > "$HOME7/.config/claude-share/repo/claude/settings.base.json"
CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 || die "laptop pushes the newer version"
desk $CS sync > "$HOME6/share-conflict2.log" 2>&1 < /dev/null || { cat "$HOME6/share-conflict2.log"; die "desk sync, nobody to ask"; }
grep -q haiku "$HOME6/.config/claude-share/repo/claude/settings.base.json" || die "newest won without a prompt"
[ "$(git -C "$S/share.git" rev-parse HEAD)" = "$(git -C "$HOME6/.config/claude-share/repo" rev-parse HEAD)" ] || die "pushed"
pass share-conflict-inline

echo "ALL PASS (HOME=$HOME)"
