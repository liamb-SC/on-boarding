#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

subjects="$(git_commit_subjects)"
count="$(git_log_count)"

assert_true "history is tidier — 5 commits squashed to 3 or fewer" test "$count" -le 3
assert_true "at least 2 commits remain (don't lose the work)"      test "$count" -ge 2
assert_not_contains "no 'wip' commits remain"  "$subjects" "wip"
assert_not_contains "no 'typo' commits remain" "$subjects" "typo"
assert_true "both files are still present" test -n "$(git_show login.js)" -a -n "$(git_show validation.js)"
assert_true "working tree is clean" git_working_tree_clean
finish
