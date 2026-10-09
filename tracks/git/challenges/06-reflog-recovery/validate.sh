#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

assert_true "important.txt is back in the project history" git_tracked important.txt
assert_contains "it contains the recovered data" "$(git_show important.txt)" "critical customer data"
assert_true "working tree is clean" git_working_tree_clean
finish
