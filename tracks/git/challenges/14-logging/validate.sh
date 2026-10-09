#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

ans() { grep -E "^$1=" "$SANDBOX_DIR/answers.txt" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '[:space:]'; }

# Truth, computed live from the repo (no hard-coded shas).
true_alice="$(g log --author=Alice --oneline | wc -l | tr -d ' ')"
true_app="$(g log --oneline -- src/app.js | wc -l | tr -d ' ')"
true_secret="$(g log -S 'SECRET_KEY' --reverse --format=%H | head -1)"

# Learner answers.
a_alice="$(ans alice_commits)"
a_app="$(ans app_changes)"
a_secret_full="$(g rev-parse "$(ans secret_commit)" 2>/dev/null)"

assert_eq "commits authored by Alice (git log --author=Alice)" "$true_alice" "$a_alice"
assert_eq "commits touching src/app.js (git log -- <path>)"    "$true_app"   "$a_app"
assert_eq "commit that introduced SECRET_KEY (git log -S)"     "$true_secret" "$a_secret_full"
finish
