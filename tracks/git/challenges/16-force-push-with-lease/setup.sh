#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"

# A bare "origin" this repo pushes to.
ORIGIN="${SANDBOX_DIR}-origin.git"
rm -rf "$ORIGIN"
git init --bare -q -b main "$ORIGIN"

sandbox_reset
sbg remote add origin "$ORIGIN"

# Shared history, then your feature branch with a typo you'll want to fix.
sb_commit base.txt "base"  "A: base"
sb_commit app.txt  "app v1" "B: app"
sbg checkout -q -b feature
sb_commit feature.txt "spellcheck: widht" "C: add feature (has a typo)"
sbg push -q -u origin main
sbg push -q -u origin feature       # origin/feature = A-B-C; your tracking ref = C

# --- Meanwhile, a teammate pushes to origin/feature (you haven't fetched it) ---
TEAM="${SANDBOX_DIR}-teammate"
rm -rf "$TEAM"
git clone -q "$ORIGIN" "$TEAM"
git -C "$TEAM" config user.name  "Teammate"
git -C "$TEAM" config user.email "teammate@onboarding.local"
git -C "$TEAM" config commit.gpgsign false
git -C "$TEAM" config core.autocrlf false
git -C "$TEAM" checkout -q feature
printf 'reviewed by teammate\n' > "$TEAM/review-fix.txt"
git -C "$TEAM" add review-fix.txt
git -C "$TEAM" commit -q -m "T: address review comments"
git -C "$TEAM" push -q origin feature   # origin/feature is now A-B-C-T
rm -rf "$TEAM"

# You are left on feature at C, unaware the remote moved on.
sbg checkout -q feature
