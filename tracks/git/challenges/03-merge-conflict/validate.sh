#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

assert_eq    "you are on the main branch" "main" "$(git_current_branch)"
assert_true  "the merge is complete (no merge in progress)" test ! -f "$SANDBOX_DIR/.git/MERGE_HEAD"
assert_true  "the feature branch is merged into main" git_branch_merged feature
assert_not_contains "no conflict markers remain in config.yaml" "$(git_show config.yaml)" "<<<<<<<"
assert_true  "working tree is clean (conflict resolved & committed)" git_working_tree_clean
finish
