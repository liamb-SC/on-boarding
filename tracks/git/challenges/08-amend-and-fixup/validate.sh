#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

assert_eq   "still a single commit (amended, not a new one)" "1" "$(git_log_count)"
assert_contains "the typo is fixed: class User" "$(git_show user.py)" "class User:"
assert_not_contains "the old typo is gone" "$(git_show user.py)" "class Usr:"
assert_true "working tree is clean" git_working_tree_clean
finish
