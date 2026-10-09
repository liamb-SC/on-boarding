#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

assert_ge   "the repo has at least one commit" 1 "$(git_log_count)"
assert_true "hello.txt is tracked (staged & committed)" g ls-files --error-unmatch hello.txt
assert_true "working tree is clean (nothing left uncommitted)" git_working_tree_clean
finish
