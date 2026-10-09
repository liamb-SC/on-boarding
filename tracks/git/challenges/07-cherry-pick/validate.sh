#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

assert_eq   "you are on the main branch" "main" "$(git_current_branch)"
assert_true "the security patch is now on main" git_tracked patch.txt
assert_contains "patch content came across" "$(git_show patch.txt)" "security patch applied"
assert_true "main's own work is still here" git_tracked main.txt
# Only the one commit should have been picked, not the whole branch merged.
assert_false "you did NOT merge the entire hotfix branch" git_branch_merged hotfix
assert_true "working tree is clean" git_working_tree_clean
finish
