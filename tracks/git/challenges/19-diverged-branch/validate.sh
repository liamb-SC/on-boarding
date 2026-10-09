#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

ORIGIN="${SANDBOX_DIR}-origin.git"

assert_true "the teammate's commit is in your local main (you integrated it)" git_tracked teammate.txt
assert_true "your own local.txt is still here" git_tracked local.txt
assert_true "your change reached origin (origin has local.txt)" git -C "$ORIGIN" cat-file -e main:local.txt
assert_true "the teammate's work is still on origin (teammate.txt)" git -C "$ORIGIN" cat-file -e main:teammate.txt
assert_true "working tree is clean" git_working_tree_clean
finish
