#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"

ORIGIN="${SANDBOX_DIR}-origin.git"
rm -rf "$ORIGIN"
git init --bare -q -b main "$ORIGIN"

sandbox_reset
sbg remote add origin "$ORIGIN"
sb_commit a.txt "a" "A: first"
sb_commit b.txt "b" "B: second"
sbg push -q -u origin main            # origin/main = A-B, tracking = B

# A teammate pushes C to origin/main.
TEAM="${SANDBOX_DIR}-teammate"
rm -rf "$TEAM"
git clone -q "$ORIGIN" "$TEAM"
git -C "$TEAM" config user.name  "Teammate"
git -C "$TEAM" config user.email "teammate@onboarding.local"
git -C "$TEAM" config commit.gpgsign false
git -C "$TEAM" config core.autocrlf false
printf 'teammate work\n' > "$TEAM/teammate.txt"
git -C "$TEAM" add teammate.txt
git -C "$TEAM" commit -q -m "C: teammate change"
git -C "$TEAM" push -q origin main
rm -rf "$TEAM"

# Meanwhile YOU commit D locally (based on B).
sb_commit local.txt "local work" "D: my local change"

# Fetch so git knows both sides moved — now `git status` reports the branches
# have DIVERGED (but nothing is merged yet).
sbg fetch -q origin
