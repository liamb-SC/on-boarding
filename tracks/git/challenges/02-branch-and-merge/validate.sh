#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

assert_eq   "you are on the main branch" "main" "$(git_current_branch)"
assert_true "feature.txt is present on main" git_tracked feature.txt
assert_true "main.txt is still present on main" git_tracked main.txt
assert_true "the feature branch is merged into main" git_branch_merged feature
assert_true "working tree is clean" git_working_tree_clean
finish
