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
git clone -q --bare "$HOME/remote-src" "$HOME/remote.git"; git clone -q --bare "$HOME/remote-src" "$HOME/remote-delta.git"
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
url_globs = ["$HOME/remote*.git", "$HOME/remote.git/**"]

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
[ -L "$HOME/.agents/skills" ] && [ "$(readlink -f "$HOME/.agents/skills")" = "$(readlink -f "$CS_CONFIG_DIR/share/claude/skills")" ] || die "~/.agents/skills is the repo skills dir"
[ -f "$CS_CONFIG_DIR/share/claude/skills/sh-skill/SKILL.md" ] && [ -f "$HOME/.claude/skills/sh-skill/SKILL.md" ] || die "skills.sh skill imported into the share"
[ -L "$HOME/.agents/.skill-lock.json" ] && grep -q sh-skill "$CS_CONFIG_DIR/share/claude/skill-lock.json" || die "skill lock imported into the share"
$CS apply --check | grep -q "no drift" || die "apply idempotent after skills import"
[ -L "$HOME/.claude/plans" ] && [ -f "$CS_CONFIG_DIR/share/plans/old.md" ] || die "plans imported into the share"
python3 - "$HOME/.claude/settings.json" <<'PY' || die "settings merged"
import json,sys; d=json.load(open(sys.argv[1]))
assert d["model"]=="opus" and d["theme"]=="light", d
assert d["permissions"]["allow"]==["Read(**)"], d   # base replaced the pre-existing file (backup kept)
PY
grep -q claude-share.inc "$HOME/.gitconfig" || die "gitconfig include"
grep -q 'hasconfig:remote.\*.url' "$HOME/.config/git/claude-share.inc" || die "includeIf rendered"
[ "$(git -C "$HOME/dev/alpha" config user.email)" = "test@example.com" ] || die "identity via includeIf"
pass apply
# (the placement rules — newer wins, worktree fan-out, pointer injected here and never stored, exclude, deletions — are tests/projectstate.test.ts's table now; this is the smoke path through cs init)
SIDE="$CS_CONFIG_DIR/share/projects/alpha"
[ -f "$SIDE/CLAUDE.md" ] && [ -f "$SIDE/.claude/settings.local.json" ] || die "alpha files imported into project state"
grep -q autoMemoryDirectory "$HOME/dev/alpha/.claude/settings.local.json" || die "autoMemoryDirectory injected"
[ -z "$(git -C "$HOME/dev/alpha" status --porcelain)" ] || die "alpha stays clean for git"
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
(cd "$CS_CONFIG_DIR/share" && [ -z "$(git status --porcelain)" ]) || die "share committed"
[ "$(git -C "$HOME/cfg.git" rev-parse HEAD)" = "$(git -C "$CS_CONFIG_DIR/share" rev-parse HEAD)" ] || die "pushed"
pass sync-copyback

# --- second machine from the same remote sees the same state
export HOME2="$(mktemp -d)"
( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share"
  mkdir -p "$HOME2/dev"
  $CS init --repo "$CFG_REMOTE" --name t2 --profiles work,personal --skip doctor,deps,ssh,secrets,hooks >/dev/null || die "init m2"
  $CS clone >/dev/null || die "clone m2"
  [ -d "$HOME2/dev/alpha/.git" ] && [ -d "$HOME2/dev/gamma/.git" ] && [ -d "$HOME2/dev/beta/repo/.git" ] || die "cloned selected projects"
  grep -q v2 "$HOME2/dev/alpha/CLAUDE.md" || die "m2 got alpha CLAUDE.md"
  # conflict: both machines edit the same memory topic -> union, no block
  echo "- [y](y.md) - m2 fact" >> "$CS_CONFIG_DIR/share/projects/alpha/memory/MEMORY.md"
  $CS share-sync >/dev/null || die "m2 sync"
)
echo "- [z](z.md) - m1 fact" >> "$SIDE/memory/MEMORY.md"
$CS share-sync >/dev/null || die "m1 sync after m2"
grep -q "m2 fact" "$SIDE/memory/MEMORY.md" && grep -q "m1 fact" "$SIDE/memory/MEMORY.md" || die "union merge"
pass two-machines-union

# --- a real (non-union) conflict through share-sync, what hooks and the timer run: settled newest-wins per file, pushed, no marker, never mid-rebase
# two local commits touch the file: the rebase stops twice on it and both stops are settled
echo '{"model":"haiku","permissions":{"allow":["Read(**)"]}}' > "$CS_CONFIG_DIR/share/claude/settings.base.json"
(cd "$CS_CONFIG_DIR/share" && git add -A && git commit -qm "m1 older")
echo '{"model":"haiku","permissions":{"allow":["Read(**)","Bash(ls *)"]}}' > "$CS_CONFIG_DIR/share/claude/settings.base.json"
(cd "$CS_CONFIG_DIR/share" && git add -A && git commit -qm "m1 older, again") ; sleep 1
( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share"
  echo '{"model":"sonnet","permissions":{"allow":["Read(**)"]}}' > "$CS_CONFIG_DIR/share/claude/settings.base.json"
  $CS share-sync >/dev/null || die "m2 conflict setup"
)
$CS share-sync > "$HOME/share-conflict.log" 2>&1 || { cat "$HOME/share-conflict.log"; die "share-sync must settle the conflict itself"; }
grep -q sonnet "$CS_CONFIG_DIR/share/claude/settings.base.json" || die "newest (m2) won"
grep -q "settled claude/settings.base.json (the other machine), claude/settings.base.json (the other machine)" "$HOME/share-conflict.log" || die "settled line names the file and the side, once per stop"
[ ! -f "$XDG_STATE_HOME/cs/sync.lock" ] || die "lock released"
[ ! -d "$CS_CONFIG_DIR/share/.git/rebase-merge" ] && [ ! -d "$CS_CONFIG_DIR/share/.git/rebase-apply" ] || die "left mid-rebase"
[ "$(git -C "$HOME/cfg.git" rev-parse HEAD)" = "$(git -C "$CS_CONFIG_DIR/share" rev-parse HEAD)" ] || die "pushed after settling"
BK="$(git -C "$CS_CONFIG_DIR/share" for-each-ref --format='%(refname)' refs/cs/backup/share | head -1)"
[ -n "$BK" ] && git -C "$CS_CONFIG_DIR/share" show "$BK:claude/settings.base.json" | grep -q haiku || die "this machine's commits kept in a backup ref with the losing version"
grep -q sonnet "$HOME/.claude/settings.json" || die "settings re-rendered after pull"
# --resolve ours overrides newest-wins (m1 newer this time would also win; make m2 newer again and keep ours)
echo '{"model":"opus","permissions":{"allow":["Read(**)"]}}' > "$CS_CONFIG_DIR/share/claude/settings.base.json"
(cd "$CS_CONFIG_DIR/share" && git add -A && git commit -qm "m1 older again") ; sleep 1
( export HOME="$HOME2" CLAUDE_CONFIG_DIR="$HOME2/.claude" XDG_STATE_HOME="$HOME2/.local/state" CS_CONFIG_DIR="$HOME2/.config/claude-share"
  $CS share-sync >/dev/null || die "m2 pull"
  echo '{"model":"sonnet","permissions":{"allow":["Read(**)","Edit(**)"]}}' > "$CS_CONFIG_DIR/share/claude/settings.base.json"
  $CS share-sync >/dev/null || die "m2 conflict setup 2"
)
$CS share-sync --resolve ours >/dev/null 2>&1 || die "share-sync --resolve ours"
grep -q opus "$CS_CONFIG_DIR/share/claude/settings.base.json" || die "--resolve ours kept this machine's version"
[ "$(git -C "$HOME/cfg.git" rev-parse HEAD)" = "$(git -C "$CS_CONFIG_DIR/share" rev-parse HEAD)" ] || die "pushed after --resolve ours"
pass share-sync-newest-wins

# --- every project has a remote (ADR-0001): a registered project without one and an unregistered dir are flagged with the fixing command
printf '\n[projects.orphan]\nprofiles = ["all"]\n' >> "$CS_CONFIG_DIR/share/projects.toml"; (cd "$CS_CONFIG_DIR/share" && git add -A && git commit -qm "orphan: registered before it had a remote")
mkdir -p "$HOME/dev/orphan" && (cd "$HOME/dev/orphan" && git init -q -b master && echo x > f && git add f && git commit -qm init)
($CS status || true) | grep -q "orphan.*no remote.*cs doctor --fix" || die "status flags the remote-less project"
($CS status || true) | grep -q "notes: empty  cs ignore notes" || die "status flags the unregistered (empty) dir"
($CS doctor || true) | grep -q "orphan: no remote" || die "doctor flags the remote-less project"
$CS doctor >/dev/null && die "doctor must fail while a project has no remote" || true
$CS >/dev/null 2>&1 || true
#            orphan: create repo? y   notes: register / ignore / leave? leave
CS_ANSWERS='["y","leave"]' $CS doctor --fix >/dev/null || die "doctor --fix"
[ -d "$HOME/gh/test/orphan.git" ] || die "doctor --fix created the (fake) GitHub repo"
[ "$(git -C "$HOME/dev/orphan" remote get-url origin)" = "$HOME/gh/test/orphan.git" ] || die "origin added"
git -C "$HOME/gh/test/orphan.git" log --oneline | grep -q init || die "pushed"
grep -A3 '^\[projects.orphan\]' "$CS_CONFIG_DIR/share/projects.toml" | grep -q 'url = ' || die "manifest url recorded"
($CS doctor || true) | grep -q "orphan" && die "orphan must be clean after --fix" || true
# cs add on a directory without a remote: same ensure-remote step
mkdir -p "$HOME/dev/notes" && (cd "$HOME/dev/notes" && git init -q -b master && echo n > n.md && git add n.md && git commit -qm notes)
$CS add "$HOME/dev/notes" >/dev/null || die "cs add remote-less"
[ -d "$HOME/gh/test/notes.git" ] && grep -q '^\[projects.notes\]' "$CS_CONFIG_DIR/share/projects.toml" || die "cs add created the repo and registered"
# cs add on a directory that already has a remote: registered as is, identity inferred from the url
git clone -q "$HOME/remote-delta.git" "$HOME/dev/delta" && $CS add "$HOME/dev/delta" >/dev/null || die "cs add with remote"
grep -A3 '^\[projects.delta\]' "$CS_CONFIG_DIR/share/projects.toml" | grep -q 'identity = "test"' || die "identity inferred"
$CS doctor >/dev/null || die "doctor clean"
pass status-doctor

# --- ignored directories (#30): a workspace directory that is not a project — a second clone of one, a plain folder, an empty one — is named
#     for what it is; cs ignore, the --fix prompt and cs remove silence it on this machine only (machine.toml ignore); cs add drops the entry
git clone -q "$HOME/remote-delta.git" "$HOME/dev/delta-scratch"; mkdir -p "$HOME/dev/scratch" "$HOME/dev/void"; echo x > "$HOME/dev/scratch/x"
($CS status > "$HOME/ign-status.log" 2>&1) && die "unregistered dirs are attention" || true
grep -q "delta-scratch: another clone of delta  cs ignore delta-scratch" "$HOME/ign-status.log" && ! grep -q "cs add ~/dev/delta-scratch" "$HOME/ign-status.log" || { cat "$HOME/ign-status.log"; die "a second clone is named, never offered cs add"; }
grep -q "scratch: not registered, no remote  cs add ~/dev/scratch · cs ignore scratch" "$HOME/ign-status.log" && grep -q "void: empty  cs ignore void" "$HOME/ign-status.log" || { cat "$HOME/ign-status.log"; die "plain and empty lines name both ways out"; }
($CS doctor > "$HOME/ign-doctor.log" 2>&1 || true); grep -q "delta-scratch: another clone of delta" "$HOME/ign-doctor.log" || { cat "$HOME/ign-doctor.log"; die "doctor says the same"; }
($CS add "$HOME/dev/delta-scratch" > "$HOME/ign-add.log" 2>&1) && die "cs add of a second clone must refuse" || true
grep -q "delta-scratch is another clone of delta" "$HOME/ign-add.log" || { cat "$HOME/ign-add.log"; die "the refusal names the project"; }
$CS ignore "$HOME/dev/delta-scratch" scratch > "$HOME/ign.log" 2>&1 || { cat "$HOME/ign.log"; die "cs ignore (path and name)"; }
grep -q "delta-scratch: ignored here" "$HOME/ign.log" && grep -q "scratch: ignored here" "$HOME/ign.log" || { cat "$HOME/ign.log"; die "one line per name"; }
grep -q '^ignore = \[.*"delta-scratch".*"scratch".*\]' "$CS_CONFIG_DIR/machine.toml" && ! grep -q "delta-scratch" "$CS_CONFIG_DIR/share/projects.toml" || die "written to machine.toml, never the share"
($CS ignore delta > "$HOME/ign-delta.log" 2>&1) && die "a registered project cannot be ignored" || true
grep -q "delta is the registered project delta" "$HOME/ign-delta.log" && grep -q "exclude in machine.toml" "$HOME/ign-delta.log" || { cat "$HOME/ign-delta.log"; die "refusal points at exclude / cs remove"; }
($CS ignore "$HOME/dev/scratch/x" > "$HOME/ign-deep.log" 2>&1) && die "only direct children" || true
grep -q "not directly under the workspace" "$HOME/ign-deep.log" || { cat "$HOME/ign-deep.log"; die "depth refusal"; }
$CS ignore scratch 2>&1 | grep -q "scratch: already ignored here" || die "ignoring twice is a no-op"
($CS status > "$HOME/ign-status2.log" 2>&1 || true); ! grep -q "delta-scratch\|scratch:" "$HOME/ign-status2.log" && grep -q "void: empty" "$HOME/ign-status2.log" || { cat "$HOME/ign-status2.log"; die "ignored dirs silent, the rest still flagged"; }
#            void: register / ignore / leave? ignore
CS_ANSWERS='["ignore"]' $CS doctor --fix > "$HOME/ign-fix.log" 2>&1 || { cat "$HOME/ign-fix.log"; die "doctor --fix ignore"; }
grep -q '"void"' "$CS_CONFIG_DIR/machine.toml" || die "--fix wrote the ignore"
$CS doctor > "$HOME/ign-doctor2.log" 2>&1 || { cat "$HOME/ign-doctor2.log"; die "doctor clean with everything ignored"; }
grep -q "nothing unregistered under the workspace (3 ignored)" "$HOME/ign-doctor2.log" || { cat "$HOME/ign-doctor2.log"; die "doctor counts the ignored"; }
($CS status > "$HOME/ign-status3.log" 2>&1 || true); ! grep -q "not registered\|: empty\|another clone" "$HOME/ign-status3.log" || { cat "$HOME/ign-status3.log"; die "nothing left to flag"; }
# cs add of an ignored directory makes it a project and drops the entry; cs remove leaves the checkout behind as an ignored directory
(cd "$HOME/dev/scratch" && git init -q -b master && git add x && git commit -qm x)
$CS add "$HOME/dev/scratch" >/dev/null || die "cs add of an ignored dir"
! grep -q '"scratch"' "$CS_CONFIG_DIR/machine.toml" && grep -q '^\[projects.scratch\]' "$CS_CONFIG_DIR/share/projects.toml" || die "registered, entry dropped"
CS_ANSWERS='["y"]' $CS remove scratch > "$HOME/ign-rm.log" 2>&1 || { cat "$HOME/ign-rm.log"; die "cs remove scratch"; }
grep -q "kept   checkout        ~/dev/scratch — just a directory now, ignored here" "$HOME/ign-rm.log" && grep -q "just a directory now, ignored here" "$HOME/ign-rm.log" || { cat "$HOME/ign-rm.log"; die "remove says the leftover is ignored"; }
grep -q '"scratch"' "$CS_CONFIG_DIR/machine.toml" && [ -d "$HOME/dev/scratch/.git" ] || die "leftover ignored, checkout kept"
($CS status > "$HOME/ign-status4.log" 2>&1 || true); ! grep -q "scratch" "$HOME/ign-status4.log" || { cat "$HOME/ign-status4.log"; die "the leftover is not flagged"; }
# the --fix prompt's register answer runs cs add; a worktrees-layout path names the directory above
mkdir -p "$HOME/dev/reg" && (cd "$HOME/dev/reg" && git init -q -b master && echo r > r && git add r && git commit -qm r)
CS_ANSWERS='["register"]' $CS doctor --fix > "$HOME/ign-fix2.log" 2>&1 || { cat "$HOME/ign-fix2.log"; die "doctor --fix register"; }
grep -q '^\[projects.reg\]' "$CS_CONFIG_DIR/share/projects.toml" && [ -d "$HOME/gh/test/reg.git" ] || { cat "$HOME/ign-fix2.log"; die "register answer ran cs add"; }
mkdir -p "$HOME/dev/wt" && git clone -q "$HOME/remote-delta.git" "$HOME/dev/wt/repo"
$CS ignore "$HOME/dev/wt/repo" 2>&1 | grep -q "wt: ignored here" || die "cs ignore of <name>/repo ignores <name>"
pass ignored-dirs

# --- hooks: the rewrite rules are a unit table (tests/hooks.test.ts); here only that the CLI installs through the share and is idempotent
$CS hooks install --no-timer >/dev/null || die "hooks install"
grep -q 'cs share-sync --push-only' "$CS_CONFIG_DIR/share/claude/settings.base.json" || die "hooks in the share"
(cd "$CS_CONFIG_DIR/share" && git log -1 --format=%s | grep -q "install cs share-sync hooks") || die "hooks committed"
N=$(git -C "$CS_CONFIG_DIR/share" rev-list --count HEAD); $CS hooks install --no-timer >/dev/null || die "hooks re-install"
[ "$(git -C "$CS_CONFIG_DIR/share" rev-list --count HEAD)" = "$N" ] || die "re-install is a no-op"
$CS handoff --mark --quiet || die "the retired hook command is still harmless"
pass hooks

# --- command surface: --help shows exactly the visible tier; hidden commands still run
VISIBLE="$($CS --help | sed -n '/^Commands:/,/^$/p' | grep -E '^  [a-z]' | awk '{print $1}' | tr '\n' ' ')"
[ "$VISIBLE" = "sync new add remove ignore clone secrets identity trust doctor update init help " ] || die "visible tier: $VISIBLE"
SEC="$($CS secrets --help | sed -n '/^Commands:/,/^$/p' | grep -E '^  [a-z]' | awk '{print $1}' | tr '\n' ' ')"
[ "$SEC" = "set get edit help " ] || die "secrets visible tier: $SEC"
$CS apply >/dev/null && $CS link >/dev/null && $CS share path >/dev/null && $CS hooks >/dev/null && $CS handoffs >/dev/null || die "hidden commands callable"
rc=0; $CS status --no-fetch >/dev/null || rc=$?; [ $rc -le 1 ] || die "cs status callable"   # 1 = something to sync (the share has unpushed commits here)
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
grep -q '^\[projects.fresh\]' "$CS_CONFIG_DIR/share/projects.toml" || die "registered"
grep -q autoMemoryDirectory "$HOME/dev/fresh/.claude/settings.local.json" || die "linked"
[ -z "$(git -C "$HOME/dev/fresh" status --porcelain)" ] || die "fresh stays clean"
if $CS new fresh --test >/dev/null 2>&1; then die "duplicate name refused"; fi
pass cs-new

# --- identity add: appended before the Projects marker, includes re-rendered, usable as --flag
$CS identity add extra --owner extra-org --name "Extra" --email extra@example.com  --no-token >/dev/null 2>&1 || die "identity add"
grep -q '^\[identities.extra\]' "$CS_CONFIG_DIR/share/projects.toml" || die "identity in manifest"
grep -q 'git@github.com:extra-org/\*\*' "$HOME/.config/git/claude-share.inc" || die "includeIf for new identity"
$CS identity ls | grep -q extra || die "identity ls"
$CS new viaflag --extra-org >/dev/null 2>&1 || die "new via --owner flag"
[ "$(git -C "$HOME/dev/viaflag" config user.email)" = "extra@example.com" ] || die "identity applied to new project"
$CS identity rename extra extra2 >/dev/null || die "identity rename"
grep -q '^\[identities.extra2\]' "$CS_CONFIG_DIR/share/projects.toml" && ! grep -q '^\[identities.extra\]' "$CS_CONFIG_DIR/share/projects.toml" || die "renamed in manifest"
[ "$(git -C "$HOME/dev/viaflag" config user.email)" = "extra@example.com" ] || die "rename keeps identity working"
[ ! -f "$HOME/.config/git/identity-extra.inc" ] || die "stale include pruned"
pass identity

# --- secrets (only when sops + age are installed): init, set, get, exec, trust a second machine, guard
if command -v sops >/dev/null && command -v age-keygen >/dev/null; then
  export SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt"
  $CS secrets init >/dev/null || die "secrets init"
  $CS secrets set global API_KEY=abc123 URL="https://x" >/dev/null || die "secrets set"
  grep -q '^API_KEY=ENC\[' "$CS_CONFIG_DIR/share/secrets/global.env" || die "encrypted on disk"
  [ "$($CS secrets get global API_KEY --show)" = "abc123" ] || die "secrets get"
  $CS secrets set alpha DB=pg >/dev/null || die "project secret"
  (cd "$HOME/dev/alpha" && [ "$($CS -q secrets exec -- sh -c 'echo $API_KEY-$DB')" = "abc123-pg" ]) || die "secrets exec"
  (cd "$HOME/dev/beta/repo" && [ "$($CS -q secrets exec -- sh -c 'echo $API_KEY-$DB')" = "abc123-" ]) || die "project scoping"
  echo "PLAIN=1" > "$CS_CONFIG_DIR/share/secrets/projects/x.env"
  (cd "$CS_CONFIG_DIR/share" && git add -A && git -c user.name=t -c user.email=t@x commit -qm plain >/dev/null 2>&1) && die "guard should refuse plaintext"
  rm "$CS_CONFIG_DIR/share/secrets/projects/x.env"; (cd "$CS_CONFIG_DIR/share" && git reset -q)
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
  [ -f "$HOME3/.ssh/cs/share" ] || die "share key generated"
  [ "$(git -C "$CS_CONFIG_DIR/share" config core.sshCommand)" = "ssh -i ~/.ssh/cs/share -o IdentitiesOnly=yes" ] || die "share pinned to the share key"
  grep -q '^\[identities.personal\]' "$CS_CONFIG_DIR/share/projects.toml" || die "first identity"
  [ -f "$HOME3/.ssh/cs/personal" ] || die "identity key generated"
  [ -f "$CS_CONFIG_DIR/share/machines/wiz1/ssh/personal.pub" ] || die "pubkey published"
  [ -L "$HOME3/.claude/CLAUDE.md" ] || die "applied"
  git -C "$HOME3/share.git" log --oneline | grep -q "skeleton" || die "pushed to share" )
export HOME4="$(mktemp -d)"
( export HOME="$HOME4" CLAUDE_CONFIG_DIR="$HOME4/.claude" XDG_STATE_HOME="$HOME4/.local/state" CS_CONFIG_DIR="$HOME4/.config/claude-share" SOPS_AGE_KEY_FILE="$HOME4/.config/sops/age/keys.txt"
  mkdir -p "$HOME4/dev"
  #        choose  url               machine  profiles  (ssh keys: skip)  (token: n)
  #            choose  url                machine  profiles   workspace   keys  token
  CS_ANSWERS='["wiz2","join","'"$HOME3"'/share.git","personal","default","skip","n","skip"]' \
    $CS init --skip deps,hooks,doctor >/dev/null || die "wizard join"
  grep -q '^\[identities.personal\]' "$CS_CONFIG_DIR/share/projects.toml" || die "joined share has identity"
  [ -f "$HOME4/.ssh/cs/share" ] && [ -f "$HOME4/.ssh/cs/personal" ] || die "join generated keys"
  [ -f "$CS_CONFIG_DIR/share/machines/wiz2/ssh/personal.pub" ] && [ -f "$CS_CONFIG_DIR/share/machines/wiz1/ssh/personal.pub" ] || die "both machines published"
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

# (cs handoff / cs resume — send, lease, over, replace, deny list, worktree creation — are tests/checkout.test.ts's table now)

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
grep -q 'cs share-sync --push-only' "$HOME6/.config/claude-share/share/claude/settings.base.json" || die "hooks installed by self-heal"
[ -f "$HOME6/.config/systemd/user/cs-sync.timer" ] || die "timer installed by self-heal"
git -C "$HOME6/dev/one" config user.name "Test User"
# leave desk: dirty tree + a note; no CS_ANSWERS and no terminal → the plan's defaults (send) are taken
echo "changed on desk" >> "$HOME6/dev/one/README"; echo "new" > "$HOME6/dev/one/notes.txt"
BEFORE="$(git -C "$HOME6/dev/one" status --porcelain | sort)"
desk $CS sync -m "carry on with the notes" > "$HOME6/sync2.log" 2>&1 || { cat "$HOME6/sync2.log"; die "desk sync 2"; }
git -C "$S/one.git" show-ref | grep -q "handoff/test-user/main" || die "handoff sent by cs sync"
[ "$(git -C "$HOME6/dev/one" status --porcelain | sort)" = "$BEFORE" ] || die "desk tree untouched after sending"
grep -q "handoffs sent" "$HOME6/sync2.log" && grep -q "1 handoff(s) sent" "$HOME6/sync2.log" || die "sync 2 output: sent + summary"
[ "$(git -C "$S/share.git" rev-parse HEAD)" = "$(git -C "$HOME6/.config/claude-share/share" rev-parse HEAD)" ] || die "share pushed at the end of the run"
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
! git -C "$S/one.git" show-ref | grep -q "handoff/test-user/main" || die "handoff deleted from the remote after applying"
(cd "$HOME7/dev/one" && laptop $CS note --print | grep -q "carry on with the notes") || die "note kept for the session-start hook"
(cd "$HOME7/dev/one" && laptop $CS note --print >/dev/null 2>&1) && die "note printed only once" || true
[ "$(git -C "$S/share.git" rev-parse HEAD)" = "$(git -C "$HOME7/.config/claude-share/share" rev-parse HEAD)" ] || die "laptop pushed the share"
# back on desk, work finished there (tree clean): nothing to do → no plan screen, "nothing to move"; the share is updated on both
(cd "$HOME6/dev/one" && git checkout -q -- . && git clean -qfd)
CS_ANSWERS='[]' desk $CS sync > "$HOME6/sync3.log" 2>&1 || { cat "$HOME6/sync3.log"; die "desk sync 3"; }
grep -q "nothing to move" "$HOME6/sync3.log" || die "nothing to move line"
[ "$(git -C "$S/share.git" rev-parse HEAD)" = "$(git -C "$HOME6/.config/claude-share/share" rev-parse HEAD)" ] || die "share updated on both"
# bare cs (#8): clean everywhere → every line clean, no "run: cs sync", exit 0
desk $CS > "$HOME6/status-clean.log" 2>&1 || { cat "$HOME6/status-clean.log"; die "cs must exit 0 when nothing is pending"; }
grep -q "one .*clean" "$HOME6/status-clean.log" && grep -q "share .*clean.*synced" "$HOME6/status-clean.log" || die "clean rows for the project and the share"
! grep -q "run: cs sync" "$HOME6/status-clean.log" || die "no run line when clean"
# self-heal: hooks, timer and a ~/.claude link removed → restored without a prompt
python3 - "$HOME6/.config/claude-share/share/claude/settings.base.json" <<'PY'
import json,sys; f=sys.argv[1]; d=json.load(open(f)); d.pop("hooks",None); json.dump(d,open(f,"w"))
PY
(cd "$HOME6/.config/claude-share/share" && git add -A && git commit -qm "hooks removed")
rm -f "$HOME6/.config/systemd/user/cs-sync.timer" "$HOME6/.config/systemd/user/cs-sync.service" "$HOME6/.claude/CLAUDE.md"
CS_ANSWERS='[]' desk $CS sync > "$HOME6/sync4.log" 2>&1 || { cat "$HOME6/sync4.log"; die "desk sync 4"; }
grep -q 'cs share-sync --push-only' "$HOME6/.config/claude-share/share/claude/settings.base.json" || die "hooks restored"
[ -f "$HOME6/.config/systemd/user/cs-sync.timer" ] || die "timer restored"
[ -L "$HOME6/.claude/CLAUDE.md" ] || die "link restored"
grep -q "repaired" "$HOME6/sync4.log" && grep -q "hooks re-installed" "$HOME6/sync4.log" || die "repairs reported"
# plan screen: "Change selection" returns to the multi-select; an explicit id is honoured
echo "again" >> "$HOME6/dev/one/README"
CS_ANSWERS='["<default>","change","","done"]' desk $CS sync > "$HOME6/sync5.log" 2>&1 || { cat "$HOME6/sync5.log"; die "desk sync 5"; }
! git -C "$S/one.git" show-ref | grep -q "handoff/test-user/main" || die "nothing sent when everything is unticked"
grep -q "0 of 1 actions" "$HOME6/sync5.log" || die "summary reflects the changed selection"
CS_ANSWERS='["send:one:main","done"]' desk $CS sync >/dev/null 2>&1 || die "desk sync 6"
git -C "$S/one.git" show-ref | grep -q "handoff/test-user/main" || die "sent by id"
# offline: the project remote and the share unreachable → reported, local parts still run, exit 0
mv "$S/one.git" "$S/one.git.off"; mv "$S/share.git" "$S/share.git.off"
CS_ANSWERS='[]' desk $CS sync > "$HOME6/sync7.log" 2>&1 || { cat "$HOME6/sync7.log"; die "offline sync must not fail"; }
grep -q "remote unreachable" "$HOME6/sync7.log" && grep -q "offline" "$HOME6/sync7.log" || die "offline reported"
(desk $CS > "$HOME6/status-offline.log" 2>&1 || true); grep -q "one .*offline" "$HOME6/status-offline.log" && grep -q "share .*offline" "$HOME6/status-offline.log" || { cat "$HOME6/status-offline.log"; die "cs prints with an offline mark"; }
mv "$S/one.git.off" "$S/one.git"; mv "$S/share.git.off" "$S/share.git"
pass cs-sync

# --- dirty tree vs waiting handoff (#6): laptop is still dirty from the handoff it applied; desk's newer handoff (sync 6) waits for the same branch
ONE7="$HOME7/dev/one"; ONE6="$HOME6/dev/one"
L_BEFORE="$(git -C "$ONE7" status --porcelain | sort)"
# keep (the default): nothing moves, the handoff stays, the run says so; no plan screen because nothing else is planned
CS_ANSWERS='["<default>"]' laptop $CS sync > "$HOME7/q-keep.log" 2>&1 || { cat "$HOME7/q-keep.log"; die "laptop keep"; }
[ "$(git -C "$ONE7" status --porcelain | sort)" = "$L_BEFORE" ] || die "keep: tree untouched"
git -C "$S/one.git" log -1 --format=%B handoff/test-user/main | grep -q "Cs-Machine: desk" || die "keep: desk's handoff still waiting"
grep -q "1 handoff(s) left waiting" "$HOME7/q-keep.log" && grep -q "kept local" "$HOME7/q-keep.log" || die "keep: reported"
[ -z "$(git -C "$ONE7" for-each-ref refs/cs/backup)" ] || die "keep: no backup ref needed"
# send mine over it: desk's handoff is kept in a backup ref here, then laptop's changes replace it on the remote; the tree stays
CS_ANSWERS='["send"]' laptop $CS sync > "$HOME7/q-send.log" 2>&1 || { cat "$HOME7/q-send.log"; die "laptop send"; }
[ "$(git -C "$ONE7" status --porcelain | sort)" = "$L_BEFORE" ] || die "send: tree untouched"
git -C "$S/one.git" log -1 --format=%B handoff/test-user/main | grep -q "Cs-Machine: laptop" || die "send: laptop's handoff replaced desk's"
BK="$(git -C "$ONE7" for-each-ref --format='%(refname)' refs/cs/backup | head -1)"
[ -n "$BK" ] && git -C "$ONE7" log -1 --format=%B "$BK" | grep -q "Cs-Machine: desk" && git -C "$ONE7" show "$BK:README" | grep -q "again" || die "send: backup ref holds desk's handoff (the losing side)"
grep -q "backed up to refs/cs/backup" "$HOME7/q-send.log" && grep -q "1 handoff(s) sent" "$HOME7/q-send.log" || die "send: reported"
# bare cs (#8) on desk: the handoff laptop just sent shows up with laptop's name — nothing on desk has fetched since; dirty + waiting → run: cs sync, exit 1
desk $CS > "$HOME6/status-waiting.log" 2>&1 && die "cs must exit 1 while something is pending" || true
grep -q "one .*dirty.*handoff waiting from laptop.*cs sync" "$HOME6/status-waiting.log" && grep -q "run: cs sync" "$HOME6/status-waiting.log" || { cat "$HOME6/status-waiting.log"; die "waiting handoff shown by bare cs"; }
# apply: on desk (dirty with "again"), laptop's handoff wins; desk's changes go to a backup ref; the handoff leaves the remote
grep -q again "$ONE6/README" || die "desk still dirty"
CS_ANSWERS='["apply"]' desk $CS sync > "$HOME6/q-apply.log" 2>&1 || { cat "$HOME6/q-apply.log"; die "desk apply"; }
[ "$(git -C "$ONE6" status --porcelain | sort)" = "$L_BEFORE" ] || die "apply: laptop's changes are here now"
grep -q "changed on desk" "$ONE6/README" && ! grep -q again "$ONE6/README" && [ "$(cat "$ONE6/notes.txt")" = "new" ] || die "apply: contents are the handoff's"
BK="$(git -C "$ONE6" for-each-ref --format='%(refname)' refs/cs/backup | head -1)"
[ -n "$BK" ] && git -C "$ONE6" show "$BK:README" | grep -q again || die "apply: backup ref holds the local changes (the losing side)"
! git -C "$S/one.git" show-ref | grep -q "handoff/test-user/main" || die "apply: handoff removed from the remote"
grep -q "backed up to refs/cs/backup" "$HOME6/q-apply.log" && grep -q "1 handoff(s) applied" "$HOME6/q-apply.log" || die "apply: reported"
pass dirty-vs-waiting

# --- share file changed on both machines (#6): cs sync asks per file and finishes rebased and pushed; memory *.md union-merges without a question
(cd "$ONE6" && git checkout -q -- . && git clean -qfd); (cd "$ONE7" && git checkout -q -- . && git clean -qfd)
mkdir -p "$HOME7/.config/claude-share/share/projects/one/memory" && echo "# one" > "$HOME7/.config/claude-share/share/projects/one/memory/MEMORY.md"
CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 || die "laptop seeds memory"
CS_ANSWERS='[]' desk $CS sync >/dev/null 2>&1 || die "desk pulls memory"
[ -f "$HOME6/.config/claude-share/share/projects/one/memory/MEMORY.md" ] || die "memory arrived on desk"
echo '{"model":"haiku","permissions":{"allow":["Read(**)"]}}' > "$HOME6/.config/claude-share/share/claude/settings.base.json"; echo "- desk fact" >> "$HOME6/.config/claude-share/share/projects/one/memory/MEMORY.md"
echo '{"model":"sonnet","permissions":{"allow":["Read(**)"]}}' > "$HOME7/.config/claude-share/share/claude/settings.base.json"; echo "- laptop fact" >> "$HOME7/.config/claude-share/share/projects/one/memory/MEMORY.md"
CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 || die "laptop pushes its side"
# exactly one answer: the settings file; a question about MEMORY.md would exhaust the scripted answers and fail the run
CS_ANSWERS='["theirs"]' desk $CS sync > "$HOME6/share-conflict.log" 2>&1 || { cat "$HOME6/share-conflict.log"; die "desk sync with a share conflict"; }
grep -q sonnet "$HOME6/.config/claude-share/share/claude/settings.base.json" || die "the other machine's version chosen"
grep -q "desk fact" "$HOME6/.config/claude-share/share/projects/one/memory/MEMORY.md" && grep -q "laptop fact" "$HOME6/.config/claude-share/share/projects/one/memory/MEMORY.md" || die "memory union-merged"
grep -q "changed on both machines" "$HOME6/share-conflict.log" && grep -q "settled claude/settings.base.json (the other machine)" "$HOME6/share-conflict.log" || die "conflict asked and settled in the same run"
[ ! -d "$HOME6/.config/claude-share/share/.git/rebase-merge" ] || die "not mid-rebase"
[ "$(git -C "$S/share.git" rev-parse HEAD)" = "$(git -C "$HOME6/.config/claude-share/share" rev-parse HEAD)" ] || die "share pushed after the conflict"
grep -q sonnet "$HOME6/.claude/settings.json" || die "settings re-rendered in the same run"
# no terminal, no answers: cs sync settles it newest-wins like share-sync
echo '{"model":"opus","permissions":{"allow":["Read(**)"]}}' > "$HOME6/.config/claude-share/share/claude/settings.base.json"
(cd "$HOME6/.config/claude-share/share" && git add -A && git commit -qm "desk older") ; sleep 1
CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 || die "laptop pulls"
echo '{"model":"haiku","permissions":{"allow":["Read(**)"]}}' > "$HOME7/.config/claude-share/share/claude/settings.base.json"
CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 || die "laptop pushes the newer version"
desk $CS sync > "$HOME6/share-conflict2.log" 2>&1 < /dev/null || { cat "$HOME6/share-conflict2.log"; die "desk sync, nobody to ask"; }
grep -q haiku "$HOME6/.config/claude-share/share/claude/settings.base.json" || die "newest won without a prompt"
[ "$(git -C "$S/share.git" rev-parse HEAD)" = "$(git -C "$HOME6/.config/claude-share/share" rev-parse HEAD)" ] || die "pushed"
pass share-conflict-inline

# --- real-branch pushes (#7): local-only commits put an unchecked push row on the plan screen; the handoff carries them either way
(cd "$ONE6" && echo "committed on desk" > commit.txt && git add commit.txt && git -c user.name="Test User" -c user.email=test@example.com commit -qm "local commit")
echo "and dirty" >> "$ONE6/README"
MAIN_BEFORE="$(git -C "$S/one.git" rev-parse main)"; DESK_HEAD="$(git -C "$ONE6" rev-parse HEAD)"
# bare cs shows the unpushed count
(cd "$ONE6" && desk $CS > "$HOME6/status-unpushed.log" 2>&1 || true); grep -q "↑1 unpushed" "$HOME6/status-unpushed.log" || die "cs shows ↑1 unpushed"
# defaults: the handoff is sent (checked), the branch is not pushed (unchecked)
CS_ANSWERS='["<default>","done"]' desk $CS sync > "$HOME6/push1.log" 2>&1 || { cat "$HOME6/push1.log"; die "desk sync with an unpushed commit"; }
grep -q "○ push  one · main" "$HOME6/push1.log" && grep -q "1 unpushed commit" "$HOME6/push1.log" && grep -q "1 of 2 actions" "$HOME6/push1.log" || die "push row listed, unchecked"
[ "$(git -C "$S/one.git" rev-parse main)" = "$MAIN_BEFORE" ] || die "defaults leave the real branch unpushed"
git -C "$S/one.git" show-ref | grep -q "handoff/test-user/main" && [ "$(git -C "$S/one.git" rev-parse 'handoff/test-user/main^')" = "$DESK_HEAD" ] || die "the handoff carries the local-only commit"
grep -q "1 handoff(s) sent" "$HOME6/push1.log" && ! grep -q "branch(es) pushed" "$HOME6/push1.log" || die "summary: sent, nothing pushed"
# the row selected: the branch reaches its upstream; the handoff is re-sent (still carries the commit)
CS_ANSWERS='["send:one:main,push:one:main","done"]' desk $CS sync > "$HOME6/push2.log" 2>&1 || { cat "$HOME6/push2.log"; die "desk sync pushing the branch"; }
[ "$(git -C "$S/one.git" rev-parse main)" = "$DESK_HEAD" ] || die "selected: the real branch was pushed"
grep -q "branches pushed" "$HOME6/push2.log" && grep -q "one · main → origin/main" "$HOME6/push2.log" && grep -q "1 branch(es) pushed" "$HOME6/push2.log" || die "push reported"
[ "$(git -C "$S/one.git" rev-parse 'handoff/test-user/main^')" = "$DESK_HEAD" ] || die "handoff still carries the commit"
# nothing unpushed any more: only the send row remains; the tree was never touched
CS_ANSWERS='["<default>","done"]' desk $CS sync > "$HOME6/push3.log" 2>&1 || { cat "$HOME6/push3.log"; die "desk sync after the push"; }
grep -q "1 of 1 actions" "$HOME6/push3.log" && ! grep -q "push " "$HOME6/push3.log" || die "no push row once the branch is up to date"
grep -q "and dirty" "$ONE6/README" && [ "$(cat "$ONE6/commit.txt")" = "committed on desk" ] || die "desk tree untouched"
pass real-branch-push

# --- handoff notes (#9): the real-binary paths only — the cap on a hanging claude, the -p invocation fed the digest, the note travelling,
#     claude missing from PATH. The decision table (-m wins, a typed note stays, no transcript…) is a unit table in tests/note.test.ts.
KEY6="$(echo "$HOME6/dev/one" | sed 's/[^A-Za-z0-9]/-/g')"; mkdir -p "$HOME6/.claude/projects/$KEY6"
python3 - "$HOME6/.claude/projects/$KEY6/s1.jsonl" <<'PY2'
import json,sys
lines=[{"type":"user","message":{"role":"user","content":"implement the widget"}},
       {"type":"assistant","message":{"role":"assistant","content":[{"type":"thinking","thinking":"secret thoughts"},{"type":"text","text":"Wiring the widget."},{"type":"tool_use","name":"Edit","input":{"file_path":"README"}}]}},
       {"type":"user","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"x","content":"tool output nobody should summarise"}]}}]
open(sys.argv[1],"w").write("".join(json.dumps(l)+"\n" for l in lines))
PY2
mkdir -p "$S/fakebin" "$S/hangbin"
cat > "$S/fakebin/claude" <<'SH'
#!/usr/bin/env bash
# fake headless claude: records the call, expects -p and the transcript digest on stdin
echo "called $*" >> "${CS_TEST_CALLS:?}"
[ "$1" = "-p" ] || { echo "not headless"; exit 0; }
IN="$(cat)"; grep -q "USER: implement the widget" <<<"$IN" && grep -q "→ Edit: README" <<<"$IN" && ! grep -q "secret thoughts\|tool output" <<<"$IN" || { echo "digest wrong: $IN"; exit 0; }
echo "Stopped: widget half wired, README edited."; echo "Next: finish the widget tests, then push."
SH
printf '#!/usr/bin/env bash\necho "called $*" >> "${CS_TEST_CALLS:?}"; sleep 30\n' > "$S/hangbin/claude"; chmod +x "$S/fakebin/claude" "$S/hangbin/claude"
export CS_TEST_CALLS="$S/claude-calls"; : > "$CS_TEST_CALLS"
NOTE() { git -C "$S/one.git" show "handoff/test-user/main:.cs-handoff/NOTE.md"; }
# claude hangs past the cap (1 s): the run finishes, the note is git-derived (branch, files, last commit, session end, why)
SECONDS=0
PATH="$S/hangbin:$PATH" CS_NOTE_TIMEOUT=1 CS_ANSWERS='["<default>","done"]' desk $CS sync > "$HOME6/note1.log" 2>&1 || { cat "$HOME6/note1.log"; die "desk sync with a hanging claude"; }
[ "$SECONDS" -lt 20 ] || die "the cap did not hold ($SECONDS s)"
NOTE > "$HOME6/note1.txt"; grep -q '^main · 1 changed file · last commit "local commit" · session ended 20' "$HOME6/note1.txt" && grep -q "^README$" "$HOME6/note1.txt" && grep -q "no summary: claude took longer than 1 s" "$HOME6/note1.txt" || { cat "$HOME6/note1.txt"; die "git-derived note"; }
grep -q "note (git-derived)" "$HOME6/note1.log" && grep -q "called -p" "$CS_TEST_CALLS" || die "generation attempted and reported"
# a working claude: its summary replaces the git-derived note, fed the digest of the transcript on stdin
: > "$CS_TEST_CALLS"
PATH="$S/fakebin:$PATH" CS_ANSWERS='["<default>","done"]' desk $CS sync > "$HOME6/note2.log" 2>&1 || { cat "$HOME6/note2.log"; die "desk sync with a fake claude"; }
NOTE > "$HOME6/note2.txt"; grep -q "^Stopped: widget half wired, README edited.$" "$HOME6/note2.txt" && grep -q "finish the widget tests" "$HOME6/note2.txt" || { cat "$HOME6/note2.txt"; die "claude's summary is the note"; }
grep -q "note (claude)" "$HOME6/note2.log" && git -C "$S/one.git" log -1 --format=%B handoff/test-user/main | grep -q "Cs-Note: Stopped: widget half wired" || die "reported; first line is the trailer"
[ ! -f "$HOME6/.claude/projects/$KEY6/s1.jsonl.bak" ] && [ "$(ls "$HOME6/.claude/projects/$KEY6" | wc -l)" = 1 ] || die "the transcript directory is untouched"
# the note travels: shown on arrival, kept for the session-start hook
CS_ANSWERS='["<default>","done"]' laptop $CS sync > "$HOME7/note-arrive.log" 2>&1 || { cat "$HOME7/note-arrive.log"; die "laptop sync"; }
grep -q "widget half wired" "$HOME7/note-arrive.log" && (cd "$ONE7" && laptop $CS note --print | grep -q "finish the widget tests") || die "generated note shown after apply and kept for the hook"
(cd "$ONE7" && git checkout -q -- . && git clean -qfd)
# no claude on PATH (every directory holding one dropped): the git-derived note says so
NOCLAUDE="$(tr ':' '\n' <<<"$PATH" | while read -r d; do [ -n "$d" ] && [ ! -e "$d/claude" ] && printf '%s:' "$d"; done)"; NOCLAUDE="${NOCLAUDE%:}"
PATH="$NOCLAUDE" CS_ANSWERS='["<default>","done"]' desk $CS sync > "$HOME6/note3.log" 2>&1 || { cat "$HOME6/note3.log"; die "desk sync without claude"; }
NOTE > "$HOME6/note3.txt"; grep -q "no summary: claude not on PATH" "$HOME6/note3.txt" && grep -q "session ended" "$HOME6/note3.txt" || { cat "$HOME6/note3.txt"; die "no claude → git-derived note saying so"; }
rm -rf "$HOME6/.claude/projects/$KEY6"
pass handoff-notes

# --- .env values travel (#10): gitignored .env files merge per key through the share's secrets area (encrypted); tracked files and
#     env = false projects are never touched; a file git would commit is refused with the fix
if command -v sops >/dev/null && command -v age-keygen >/dev/null; then
  ENVDIR6="$HOME6/.config/claude-share/share/secrets/projects"
  # both trees clean, nothing waiting: laptop takes desk's last handoff and drops it
  CS_ANSWERS='["<default>","done"]' laptop $CS sync >/dev/null 2>&1 || die "laptop takes the last handoff"
  (cd "$ONE7" && git checkout -q -- . && git clean -qfd); (cd "$ONE6" && git checkout -q -- . && git clean -qfd)
  # secrets by hand (what the wizard walks through): desk's key, laptop's key published, desk trusts laptop, both sync
  desk $CS secrets init >/dev/null || die "desk secrets init"
  CS_ANSWERS='[]' desk $CS sync >/dev/null 2>&1 && CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 || die "desk's recipient list reaches laptop"
  laptop $CS secrets init >/dev/null 2>&1 && CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 || die "laptop publishes its key"
  CS_ANSWERS='[]' desk $CS sync >/dev/null 2>&1 && desk $CS trust laptop >/dev/null || die "desk trusts laptop"
  CS_ANSWERS='[]' desk $CS sync >/dev/null 2>&1 && CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 || die "trust reaches laptop"
  # .env must be gitignored to travel; the tracked .env.example is git's business
  (cd "$ONE6" && printf '.env*\n!.env.example\n' > .gitignore && echo 'DB=postgres://localhost/db' > .env.example && git add .gitignore .env.example && git -c user.name="Test User" -c user.email=test@example.com commit -qm "env files" && git push -q origin main)
  (cd "$ONE7" && git pull -q)
  printf '# database\nDB=pg\nAPI_KEY=s3cret-one\n' > "$ONE6/.env"
  CS_ANSWERS='["<default>","done"]' desk $CS sync > "$HOME6/env1.log" 2>&1 || { cat "$HOME6/env1.log"; die "desk sync stores .env"; }
  grep -q "✓ env   one · .env  store 2 keys" "$HOME6/env1.log" && grep -q "2 keys stored" "$HOME6/env1.log" && grep -q "1 .env file(s) merged" "$HOME6/env1.log" || { cat "$HOME6/env1.log"; die "env row on the plan screen, done line, summary"; }
  grep -q '^API_KEY=ENC\[' "$ENVDIR6/one.env" || die "encrypted entry in the share"
  ! git -C "$S/share.git" grep -q "s3cret-one" HEAD || die "the value is nowhere in the share in plaintext"
  [ ! -e "$ENVDIR6/one.example.env" ] || die "a tracked .env.example is never stored"
  [ -z "$(git -C "$ONE6" status --porcelain)" ] || die "desk tree clean for git"
  # laptop: the file arrives with its values, private to the user
  CS_ANSWERS='["<default>","done"]' laptop $CS sync > "$HOME7/env1.log" 2>&1 || { cat "$HOME7/env1.log"; die "laptop sync takes .env"; }
  grep -q "one · .env  take 2 keys from desk" "$HOME7/env1.log" && grep -q "2 keys taken from desk" "$HOME7/env1.log" || { cat "$HOME7/env1.log"; die "row says where the keys come from"; }
  grep -q '^DB=pg$' "$ONE7/.env" && grep -q '^API_KEY=s3cret-one$' "$ONE7/.env" && [ "$(stat -c %a "$ONE7/.env")" = "600" ] || die "values arrived on laptop in a private file"
  [ -z "$(git -C "$ONE7" status --porcelain)" ] || die "laptop tree clean for git"
  # a different key changed on each side: both changes survive the round trip; comments and order are kept
  sed -i 's/^DB=pg$/DB=mysql/' "$ONE6/.env"; echo 'NEW=1' >> "$ONE7/.env"
  CS_ANSWERS='["<default>","done"]' desk $CS sync >/dev/null 2>&1 || die "desk stores DB"
  CS_ANSWERS='["<default>","done"]' laptop $CS sync > "$HOME7/env2.log" 2>&1 || { cat "$HOME7/env2.log"; die "laptop takes DB, stores NEW"; }
  grep -q "one · .env  store 1 key, take 1 key from desk" "$HOME7/env2.log" || { cat "$HOME7/env2.log"; die "both directions on one row"; }
  CS_ANSWERS='["<default>","done"]' desk $CS sync > "$HOME6/env3.log" 2>&1 || die "desk takes NEW"
  grep -q "take 1 key from laptop" "$HOME6/env3.log" || die "stored side named by machine"
  for f in "$ONE6/.env" "$ONE7/.env"; do grep -q '^DB=mysql$' "$f" && grep -q '^NEW=1$' "$f" && grep -q '^API_KEY=s3cret-one$' "$f" || die "every key on both machines ($f)"; done
  [ "$(head -1 "$ONE6/.env")" = "# database" ] && [ "$(sed -n 2p "$ONE6/.env")" = "DB=mysql" ] || die "the local file is patched in place"
  CS_ANSWERS='[]' desk $CS sync > "$HOME6/env4.log" 2>&1 || die "desk in sync"
  grep -q "nothing to move" "$HOME6/env4.log" || die "nothing to move once merged"
  # the same key changed on both sides since the last sync: asked per key, the chosen value wins everywhere
  sed -i 's/^API_KEY=.*/API_KEY=from-desk/' "$ONE6/.env"; sed -i 's/^API_KEY=.*/API_KEY=from-laptop/' "$ONE7/.env"
  CS_ANSWERS='["<default>","done"]' desk $CS sync >/dev/null 2>&1 || die "desk stores its value"
  CS_ANSWERS='["<default>","done","local"]' laptop $CS sync > "$HOME7/env5.log" 2>&1 || { cat "$HOME7/env5.log"; die "laptop is asked"; }
  grep -q "1 key changed on both machines — asked next" "$HOME7/env5.log" && grep -q "one · .env: API_KEY — this machine's value kept" "$HOME7/env5.log" || { cat "$HOME7/env5.log"; die "conflict on the row, then asked"; }
  grep -q '^API_KEY=from-laptop$' "$ONE7/.env" || die "laptop kept its value"
  CS_ANSWERS='["<default>","done"]' desk $CS sync >/dev/null 2>&1 && grep -q '^API_KEY=from-laptop$' "$ONE6/.env" || die "the chosen value reached desk"
  ! git -C "$S/share.git" grep -q -e "from-laptop" -e "from-desk" -e "mysql" HEAD || die "no value ever in the share in plaintext"
  [ "$(grep -c '^API_KEY=from-desk$' "$HOME6/.local/state/cs/env/one/.env.prev")" = 1 ] || die "the previous local text is kept before a patch"
  # a file missing on one side is pulled back, never deleted on the other: laptop loses its .env, the next sync restores it from the share
  rm "$ONE7/.env"
  CS_ANSWERS='["<default>","done"]' laptop $CS sync > "$HOME7/env-restore.log" 2>&1 || { cat "$HOME7/env-restore.log"; die "laptop sync without its .env"; }
  grep -q "one · .env  take 3 keys from laptop" "$HOME7/env-restore.log" && grep -q '^API_KEY=from-laptop$' "$ONE7/.env" && grep -q '^NEW=1$' "$ONE7/.env" || { cat "$HOME7/env-restore.log"; die "missing file pulled, not propagated as a delete"; }
  [ -f "$ENVDIR6/one.env" ] || die "the share entry survives"
  # .env.production is its own entry; bare cs shows a pending .env change
  echo 'PROD=1' > "$ONE6/.env.production"; echo 'LATER=2' >> "$ONE6/.env"
  (desk $CS > "$HOME6/status-env.log" 2>&1 || true); grep -q "one .*\.env: store 1 key .*\.env\.production: store 1 key.*cs sync" "$HOME6/status-env.log" || { cat "$HOME6/status-env.log"; die "cs shows the .env changes"; }
  CS_ANSWERS='["<default>","done"]' desk $CS sync > "$HOME6/env6.log" 2>&1 || { cat "$HOME6/env6.log"; die "desk stores both files"; }
  grep -q "one · .env.production  store 1 key" "$HOME6/env6.log" && grep -q "2 .env file(s) merged" "$HOME6/env6.log" && [ -f "$ENVDIR6/one.production.env" ] || die "own entry per file"
  CS_ANSWERS='["<default>","done"]' laptop $CS sync >/dev/null 2>&1 && [ "$(cat "$ONE7/.env.production")" = "PROD=1" ] && grep -q '^LATER=2$' "$ONE7/.env" || die "both files arrived"
  # env = false: the project's .env is never observed, stored or written
  git init -q -b main "$S/two-src" && (cd "$S/two-src" && echo x > README && echo '.env' > .gitignore && git add . && git commit -qm init) && git clone -q --bare "$S/two-src" "$S/two.git"
  cat >> "$HOME6/.config/claude-share/share/projects.toml" <<TOML

[projects.two]
url = "$S/two.git"
identity = "test"
branch = "main"
profiles = ["all"]
env = false
TOML
  CS_ANSWERS='[]' desk $CS sync >/dev/null 2>&1 && [ -d "$HOME6/dev/two/.git" ] || die "desk registers and clones two"
  echo 'SECRET=never' > "$HOME6/dev/two/.env"
  CS_ANSWERS='[]' desk $CS sync > "$HOME6/env7.log" 2>&1 || { cat "$HOME6/env7.log"; die "desk sync with env = false"; }
  ! grep -q "two · .env" "$HOME6/env7.log" && [ ! -e "$ENVDIR6/two.env" ] || die "env = false: never stored"
  CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 && [ -d "$HOME7/dev/two/.git" ] && [ ! -e "$HOME7/dev/two/.env" ] || die "env = false: never written"
  # a .env file git would commit is not carried; the line says what to do
  printf '!.env.staging\n' >> "$ONE6/.gitignore"; echo 'S=1' > "$ONE6/.env.staging"
  CS_ANSWERS='[]' desk $CS sync > "$HOME6/env8.log" 2>&1 || { cat "$HOME6/env8.log"; die "desk sync with an unignored file"; }
  grep -q "one: .env.staging is not gitignored — not carried (add it to .gitignore)" "$HOME6/env8.log" && [ ! -e "$ENVDIR6/one.staging.env" ] || { cat "$HOME6/env8.log"; die "unignored file refused with the fix"; }
  (cd "$ONE6" && git checkout -q -- .gitignore && rm .env.staging)
  pass env-values

  # --- .env.local travels keys only (#11): a key new on the other machine arrives with the .env.example value or empty, an existing
  #     value is never touched, nothing is asked (self-heal), bare cs names the keys to fill in; env.local = [...] makes another file keys-only
  (cd "$ONE6" && echo 'PORT=3000' >> .env.example && git add .env.example && git -c user.name="Test User" -c user.email=test@example.com commit -qm "example port" && git push -q origin main)
  (cd "$ONE7" && git pull -q)
  printf 'HOST=10.0.0.7\n' > "$ONE7/.env.local"; printf 'KEY=1.2.3.4\nPORT=8080\n' > "$ONE6/.env.local"
  CS_ANSWERS='[]' desk $CS sync > "$HOME6/local1.log" 2>&1 || { cat "$HOME6/local1.log"; die "desk sync stores the keys"; }
  grep -q "one · .env.local  store 2 keys" "$HOME6/local1.log" && grep -q "one · .env.local: 2 keys stored" "$HOME6/local1.log" && [ -f "$ENVDIR6/one.local.env" ] || { cat "$HOME6/local1.log"; die "keys stored without a plan row"; }
  ! git -C "$S/share.git" grep -q -e "1.2.3.4" -e "8080" HEAD || die "a .env.local value never reaches the share"
  CS_ANSWERS='[]' laptop $CS sync > "$HOME7/local1.log" 2>&1 || { cat "$HOME7/local1.log"; die "laptop sync takes the keys"; }
  grep -q "one · .env.local  store 1 key, take 2 keys from desk (1 to fill in)" "$HOME7/local1.log" && grep -q "one · .env.local: 1 key stored, 2 keys taken from desk — to fill in: KEY" "$HOME7/local1.log" || { cat "$HOME7/local1.log"; die "keys-only lines say what arrived and what to fill in"; }
  [ "$(cat "$ONE7/.env.local")" = "$(printf 'HOST=10.0.0.7\nKEY=\nPORT=3000')" ] || { cat "$ONE7/.env.local"; die "laptop: own value kept, KEY empty, PORT from .env.example"; }
  laptop $CS > "$HOME7/status-local.log" 2>&1 || { cat "$HOME7/status-local.log"; die "keys to fill are not something cs sync can do: exit 0"; }
  grep -q "one .*\.env\.local: 1 key to fill in (KEY)" "$HOME7/status-local.log" && ! grep -q "run: cs sync" "$HOME7/status-local.log" || { cat "$HOME7/status-local.log"; die "cs names the key to fill in"; }
  CS_ANSWERS='[]' desk $CS sync > "$HOME6/local2.log" 2>&1 || { cat "$HOME6/local2.log"; die "desk takes HOST"; }
  grep -q "to fill in: HOST" "$HOME6/local2.log" && [ "$(cat "$ONE6/.env.local")" = "$(printf 'KEY=1.2.3.4\nPORT=8080\nHOST=')" ] || { cat "$HOME6/local2.log"; cat "$ONE6/.env.local"; die "desk: HOST arrives empty (no example), own values untouched"; }
  sed -i 's/^HOST=$/HOST=10.0.0.6/' "$ONE6/.env.local"
  CS_ANSWERS='[]' desk $CS sync > "$HOME6/local3.log" 2>&1 && grep -q "nothing to move" "$HOME6/local3.log" || { cat "$HOME6/local3.log"; die "filling a value in moves nothing"; }
  # a key removed on one machine leaves the other machine's file too (the set of keys never drifts); the previous text is kept
  sed -i '/^PORT=/d' "$ONE6/.env.local"
  CS_ANSWERS='[]' desk $CS sync >/dev/null 2>&1 && CS_ANSWERS='[]' laptop $CS sync > "$HOME7/local2.log" 2>&1 || die "removal round trip"
  grep -q "one · .env.local  drop 1 key here" "$HOME7/local2.log" && [ "$(cat "$ONE7/.env.local")" = "$(printf 'HOST=10.0.0.7\nKEY=')" ] && grep -q '^PORT=3000$' "$HOME7/.local/state/cs/env/one/.env.local.prev" || { cat "$HOME7/local2.log"; die "PORT dropped on laptop, previous text kept"; }
  # env.local = [".env.site"] in the manifest: another file is keys-only
  printf '\n[projects.one.env]\nlocal = [".env.site"]\n' >> "$HOME6/.config/claude-share/share/projects.toml"
  echo 'SITE=desk' > "$ONE6/.env.site"
  CS_ANSWERS='[]' desk $CS sync > "$HOME6/local4.log" 2>&1 || { cat "$HOME6/local4.log"; die "desk stores .env.site keys"; }
  grep -q "one · .env.site  store 1 key" "$HOME6/local4.log" && ! git -C "$S/share.git" grep -q "SITE=desk" HEAD || { cat "$HOME6/local4.log"; die ".env.site is keys-only"; }
  CS_ANSWERS='[]' laptop $CS sync > "$HOME7/local3.log" 2>&1 && [ "$(cat "$ONE7/.env.site")" = "SITE=" ] || { cat "$HOME7/local3.log"; die ".env.site arrives with its key to fill in"; }
  pass env-local
else
  echo "SKIP env-values (sops/age not installed)"
fi

# --- old on-disk names (#13): a machine set up before the glossary → cs doctor names every move, --fix performs the local ones
#     (share key + the share's ssh command, share checkout + machine.toml key, state files, manifest keys), a handoff under the
#     old ref namespace is reported with the exact git command; links and memory paths follow the moved share; it still syncs
CS_ANSWERS='[]' desk $CS sync >/dev/null 2>&1 || die "desk in sync before the migration"
CFG6="$HOME6/.config/claude-share"; ST6="$HOME6/.local/state/cs"
mv "$CFG6/share" "$CFG6/repo"
mkdir -p "$HOME6/.ssh/cs" && ssh-keygen -q -t ed25519 -N "" -C "cs:desk:master" -f "$HOME6/.ssh/cs/master"
git -C "$CFG6/repo" config core.sshCommand "ssh -i ~/.ssh/cs/master -o IdentitiesOnly=yes"
sed -i 's|^\[secrets\]|repo = "~/.config/claude-share/repo"\n[secrets]|' "$CFG6/machine.toml"
mv "$ST6/last-sync" "$ST6/last-config"; mv "$ST6/project-state" "$ST6/link"; touch "$ST6/sync-config.lock" "$ST6/blocked-config"; echo '{}' > "$ST6/handoff/pending"
sed -i -e 's/^\[projects.one\]$/[projects.one]\nkind = "git"/' -e 's/^owner = "test"$/github_owner = "test"/' "$CFG6/repo/projects.toml"
git -C "$ONE6" push -q origin main:refs/heads/wip/test-user/main && git -C "$ONE6" update-ref -d refs/remotes/origin/wip/test-user/main   # as if sent by the old version on the other machine: not fetched here yet
(desk $CS doctor > "$HOME6/doctor-old.log" 2>&1 || true)
for want in "old name — share key ~/.ssh/cs/master: mv ~/.ssh/cs/master ~/.ssh/cs/share" "share checkout ~/.config/claude-share/repo: mv ~/.config/claude-share/repo ~/.config/claude-share/share" \
  "state file last-config: mv last-config last-sync" "state directory link/: mv link project-state" "state file sync-config.lock: rm" "state file blocked-config: rm" "state file handoff/pending: rm" \
  "projects.toml keys \`kind\` / \`github_owner\`" "one: handoff wip/test-user/main on the remote: apply it with the cs that sent it, or rename it there: git -C ~/dev/one fetch origin +refs/heads/wip/test-user/main:refs/remotes/origin/wip/test-user/main && git -C ~/dev/one push origin refs/remotes/origin/wip/test-user/main:refs/heads/handoff/test-user/main :refs/heads/wip/test-user/main && git -C ~/dev/one update-ref -d refs/remotes/origin/wip/test-user/main" \
  "cs doctor --fix; docs/MIGRATION.md" "by hand; docs/MIGRATION.md"; do
  grep -qF -- "$want" "$HOME6/doctor-old.log" || { cat "$HOME6/doctor-old.log"; die "doctor names the move: $want"; }
done
(CS_ANSWERS='[]' desk $CS doctor --fix > "$HOME6/doctor-fix.log" 2>&1 || true)
[ -d "$CFG6/share" ] && [ ! -e "$CFG6/repo" ] || { cat "$HOME6/doctor-fix.log"; die "share checkout moved"; }
[ -f "$HOME6/.ssh/cs/share" ] && [ -f "$HOME6/.ssh/cs/share.pub" ] && [ ! -e "$HOME6/.ssh/cs/master" ] || die "share key renamed"
[ "$(git -C "$CFG6/share" config core.sshCommand)" = "ssh -i ~/.ssh/cs/share -o IdentitiesOnly=yes" ] || die "share pinned to the renamed key"
! grep -q '^repo' "$CFG6/machine.toml" || die "machine.toml key gone"
[ -f "$ST6/last-sync" ] && [ ! -e "$ST6/last-config" ] && [ -d "$ST6/project-state" ] && [ ! -e "$ST6/link" ] && [ ! -e "$ST6/sync-config.lock" ] && [ ! -e "$ST6/blocked-config" ] && [ ! -e "$ST6/handoff/pending" ] || die "state files moved"
! grep -q -e '^kind' -e 'github_owner' "$CFG6/share/projects.toml" && grep -q '^owner = "test"$' "$CFG6/share/projects.toml" || die "manifest keys rewritten"
[ -e "$HOME6/.claude/CLAUDE.md" ] && readlink "$HOME6/.claude/CLAUDE.md" | grep -q "claude-share/share/claude/CLAUDE.md" || die "~/.claude links follow the moved share"
grep -q "claude-share/share/projects/one/memory" "$ONE6/.claude/settings.local.json" || die "memory path in the checkout follows the moved share"
grep -q "share key ~/.ssh/cs/master: mv ~/.ssh/cs/master ~/.ssh/cs/share" "$HOME6/doctor-fix.log" && grep -q "one: handoff wip/test-user/main" "$HOME6/doctor-fix.log" || { cat "$HOME6/doctor-fix.log"; die "--fix reports its moves and what is left"; }
git -C "$ONE6" fetch -q origin +refs/heads/wip/test-user/main:refs/remotes/origin/wip/test-user/main && git -C "$ONE6" push -q origin refs/remotes/origin/wip/test-user/main:refs/heads/handoff/test-user/main :refs/heads/wip/test-user/main && git -C "$ONE6" update-ref -d refs/remotes/origin/wip/test-user/main
git -C "$ONE6" push -q origin :refs/heads/handoff/test-user/main
(desk $CS doctor > "$HOME6/doctor-new.log" 2>&1 || true); grep -q "on-disk names current" "$HOME6/doctor-new.log" && ! grep -q "old name" "$HOME6/doctor-new.log" || { cat "$HOME6/doctor-new.log"; die "nothing old left"; }
CS_ANSWERS='[]' desk $CS sync > "$HOME6/mig-sync.log" 2>&1 || { cat "$HOME6/mig-sync.log"; die "cs sync after the migration"; }
[ "$(git -C "$S/share.git" rev-parse HEAD)" = "$(git -C "$CFG6/share" rev-parse HEAD)" ] || die "the share still syncs from its new place"
CS_ANSWERS='[]' laptop $CS sync >/dev/null 2>&1 && grep -q '^owner = "test"$' "$HOME7/.config/claude-share/share/projects.toml" || die "the rewritten manifest reaches the other machine"
pass migration

# --- cs remove (#24): a project goes out of the share — manifest block and sub-tables, project state, secrets — in one commit named after it,
#     after one confirmation; its checkout and remote are never touched, only the auto-memory pointer cs wrote is taken back; the other
#     machine tidies its own copy on its next cs sync; status and doctor offer cs remove instead of pointing at a machine that may be gone
echo '# one guidance' > "$ONE6/CLAUDE.md"; echo '{"permissions":{"allow":["Bash(ls)"]}}' > "$ONE6/.claude/settings.local.json"
CS_ANSWERS='[]' desk $CS sync >/dev/null 2>&1 || die "desk sync before remove"
git -C "$CFG6/share" ls-files --error-unmatch projects/one/CLAUDE.md >/dev/null 2>&1 || die "one has project state in the share"
grep -q autoMemoryDirectory "$ONE6/.claude/settings.local.json" && grep -q 'Bash(ls)' "$ONE6/.claude/settings.local.json" || die "pointer and own settings present before remove"
grep -q '"root": ".*/dev/one"' "$ST6/project-state/one.json" || die "the placed-files record names the checkout root (where the sweep looks once the entry is gone)"
printf '\n[projects.one.handoff]\nextra = ["dist/"]\n' >> "$CFG6/share/projects.toml"
mkdir -p "$CFG6/share/secrets/projects" && printf 'API=ENC[x]\nsops_version=3.9.0\n' > "$CFG6/share/secrets/projects/one.env"   # the shape the share's plaintext guard accepts
(cd "$CFG6/share" && git add -A && git commit -qm "one: handoff table + secrets")
# an unknown name removes nothing and lists what is known; no terminal and no --yes refuses; "n" changes nothing
(desk $CS remove nope > "$HOME6/rm-nope.log" 2>&1) && die "unknown name must fail" || true
grep -q "unknown project 'nope'" "$HOME6/rm-nope.log" && grep -q "known: one" "$HOME6/rm-nope.log" || { cat "$HOME6/rm-nope.log"; die "unknown name names the known projects"; }
(desk $CS remove one > "$HOME6/rm-noyes.log" 2>&1) && die "no terminal, no --yes must refuse" || true
grep -q "add --yes" "$HOME6/rm-noyes.log" || { cat "$HOME6/rm-noyes.log"; die "refusal hints at --yes"; }
CS_ANSWERS='["n"]' desk $CS remove one > "$HOME6/rm-n.log" 2>&1 || { cat "$HOME6/rm-n.log"; die "declining is not a failure"; }
grep -q "nothing removed" "$HOME6/rm-n.log" && grep -q '^\[projects.one\]' "$CFG6/share/projects.toml" && [ -f "$CFG6/share/projects/one/CLAUDE.md" ] && [ -f "$CFG6/share/secrets/projects/one.env" ] || die "n changes nothing"
# "y": the summary names what goes and what is kept; everything named goes in one commit; the checkout keeps everything but the pointer
BEFORE_RM="$(git -C "$CFG6/share" rev-parse HEAD)"
CS_ANSWERS='["y"]' desk $CS remove one > "$HOME6/rm-y.log" 2>&1 || { cat "$HOME6/rm-y.log"; die "cs remove one"; }
for want in "manifest entry" "[projects.one]" "[projects.one.handoff]" "project state" "projects/one/" "secrets/projects/one.env" "kept   checkout" "~/dev/one" "kept   remote" \
  "removed one from the share" "checkout kept at ~/dev/one" "the remote stays" "undo: git -C ~/.config/claude-share/share revert"; do
  grep -qF -- "$want" "$HOME6/rm-y.log" || { cat "$HOME6/rm-y.log"; die "remove output: $want"; }
done
! grep -q '^\[projects.one' "$CFG6/share/projects.toml" && grep -q '^\[identities.test\]' "$CFG6/share/projects.toml" || die "manifest block and sub-table gone, the rest kept"
[ ! -e "$CFG6/share/projects/one" ] && [ ! -e "$CFG6/share/secrets/projects/one.env" ] || die "project state and secrets gone"
[ "$(git -C "$CFG6/share" log -1 --format=%s)" = "remove one" ] && [ "$(git -C "$CFG6/share" rev-parse HEAD~1)" = "$BEFORE_RM" ] && [ -z "$(git -C "$CFG6/share" status --porcelain)" ] || die "one share commit named after the project"
[ -d "$ONE6/.git" ] && [ -f "$ONE6/CLAUDE.md" ] && [ -f "$ONE6/README" ] && git -C "$S/one.git" rev-parse HEAD >/dev/null || die "checkout and remote untouched"
! grep -q autoMemoryDirectory "$ONE6/.claude/settings.local.json" && grep -q 'Bash(ls)' "$ONE6/.claude/settings.local.json" || die "pointer stripped, own settings kept"
grep -q '^\.claude/$' "$ONE6/.git/info/exclude" || die "exclude lines kept"
[ ! -e "$ST6/project-state/one.json" ] || die "placed-files record dropped"
git -C "$CFG6/share" revert --no-edit HEAD >/dev/null && grep -q '^\[projects.one.handoff\]' "$CFG6/share/projects.toml" && [ -f "$CFG6/share/projects/one/CLAUDE.md" ] && [ -f "$CFG6/share/secrets/projects/one.env" ] || die "git revert brings everything back"
git -C "$CFG6/share" reset -q --hard HEAD~1
# leftovers: state or secrets for names no manifest entry knows → doctor points at cs remove; several names go in one call (--yes), --no-commit leaves the commit to the user
mkdir -p "$CFG6/share/projects/ghost" "$CFG6/share/secrets/projects" && echo x > "$CFG6/share/projects/ghost/CLAUDE.md" && printf 'K=ENC[v]\nsops_version=3.9.0\n' | tee "$CFG6/share/secrets/projects/ghost2.env" "$CFG6/share/secrets/projects/ghost2.staging.env" > "$CFG6/share/secrets/projects/ghost3.env"
(cd "$CFG6/share" && git add -A && git commit -qm "leftovers")
(desk $CS doctor > "$HOME6/doctor-ghost.log" 2>&1 || true)
grep -q "ghost: state/secrets in the share but not registered  (cs remove ghost)" "$HOME6/doctor-ghost.log" && grep -q "(cs remove ghost2)" "$HOME6/doctor-ghost.log" && ! grep -q "ghost2.staging" "$HOME6/doctor-ghost.log" || { cat "$HOME6/doctor-ghost.log"; die "doctor flags the leftovers, one line per name (.env.staging folds into ghost2)"; }
desk $CS remove ghost ghost2 --yes >/dev/null 2>&1 || die "remove two orphans with --yes"
[ ! -e "$CFG6/share/projects/ghost" ] && [ ! -e "$CFG6/share/secrets/projects/ghost2.env" ] && [ ! -e "$CFG6/share/secrets/projects/ghost2.staging.env" ] && [ "$(git -C "$CFG6/share" log -1 --format=%s)" = "remove ghost, ghost2" ] || die "orphans (and the .env.staging entry) removed in one commit"
desk $CS remove ghost3 --yes --no-commit >/dev/null 2>&1 || die "remove --no-commit"
[ ! -e "$CFG6/share/secrets/projects/ghost3.env" ] && git -C "$CFG6/share" status --porcelain | grep -q "secrets/projects/ghost3.env" || die "--no-commit leaves the deletion uncommitted"
(cd "$CFG6/share" && git add -A && git commit -qm "remove ghost3")
(desk $CS doctor > "$HOME6/doctor-clean.log" 2>&1 || true); grep -q "registered projects only" "$HOME6/doctor-clean.log" || { cat "$HOME6/doctor-clean.log"; die "doctor clean after removal"; }
# a project with no remote that is not here: status offers cs remove beside the machine that has it; doctor's "no remote" line does the same
printf '\n[projects.phantom]\nprofiles = ["all"]\n' >> "$CFG6/share/projects.toml"; (cd "$CFG6/share" && git add -A && git commit -qm "phantom")
(desk $CS status --no-fetch > "$HOME6/status-phantom.log" 2>&1 || true)
grep -q "phantom.*no remote, not here.*cs doctor --fix on the machine that has it · or cs remove phantom" "$HOME6/status-phantom.log" || { cat "$HOME6/status-phantom.log"; die "status offers cs remove"; }
mkdir -p "$HOME6/dev/phantom" && (cd "$HOME6/dev/phantom" && git init -q -b master && echo p > p && git add p && git commit -qm p)
(desk $CS doctor > "$HOME6/doctor-phantom.log" 2>&1 || true); grep -q "phantom: no remote  (cs doctor --fix · or cs remove phantom)" "$HOME6/doctor-phantom.log" || { cat "$HOME6/doctor-phantom.log"; die "doctor offers cs remove"; }
desk $CS remove phantom --yes >/dev/null 2>&1 && ! grep -q phantom "$CFG6/share/projects.toml" && [ -f "$HOME6/dev/phantom/p" ] || die "phantom removed, its directory kept"
# the other machine: its next cs sync strips the pointer from its own checkout of the removed project and drops its record — nothing else
grep -q autoMemoryDirectory "$ONE7/.claude/settings.local.json" || die "laptop still has the pointer before its sync"
desk $CS share-sync >/dev/null 2>&1 || die "desk pushes the share"
CS_ANSWERS='[]' laptop $CS sync > "$HOME7/sync-removed.log" 2>&1 || { cat "$HOME7/sync-removed.log"; die "laptop sync after the removal"; }
grep -q "one: auto-memory pointer removed from ~/dev/one" "$HOME7/sync-removed.log" || { cat "$HOME7/sync-removed.log"; die "laptop reports the tidy-up"; }
[ -d "$ONE7/.git" ] && [ -f "$ONE7/README" ] || die "laptop checkout kept"
{ [ ! -e "$ONE7/.claude/settings.local.json" ] || ! grep -q autoMemoryDirectory "$ONE7/.claude/settings.local.json"; } || die "laptop pointer stripped"
[ ! -e "$HOME7/.local/state/cs/project-state/one.json" ] || die "laptop record dropped"
CS_ANSWERS='[]' laptop $CS sync > "$HOME7/sync-removed2.log" 2>&1 && ! grep -q "pointer removed" "$HOME7/sync-removed2.log" || die "the tidy-up happens once"
pass remove

echo "ALL PASS (HOME=$HOME)"
