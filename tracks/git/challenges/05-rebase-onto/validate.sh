#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

assert_eq   "you are on the feature branch" "feature" "$(git_current_branch)"
assert_true "feature now includes main's latest commit (C)" git_in_history main
assert_true "your feature work is still here" git_tracked feature.txt
assert_true "history is linear (rebased, not merged)" git_is_linear_history
assert_true "working tree is clean" git_working_tree_clean
finish
