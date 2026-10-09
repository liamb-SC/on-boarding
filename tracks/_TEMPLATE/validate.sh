#!/usr/bin/env bash
# validate.sh — inspect the sandbox and decide pass/fail.
# Runner exports REPO_ROOT and SANDBOX_DIR before calling this.
source "$REPO_ROOT/lib/common.sh"

# Assertion helpers (each prints ✓/✗ and tallies):
#   assert_true  "desc" <cmd...>        pass if command exits 0
#   assert_false "desc" <cmd...>        pass if command exits non-zero
#   assert_eq    "desc" <expected> <actual>
#   assert_ge    "desc" <min> <actual>          numeric >=
#   assert_contains     "desc" <haystack> <needle>
#   assert_not_contains "desc" <haystack> <needle>
#
# Git-state helpers (echo a value or return status), operating on the sandbox:
#   git_log_count, git_current_branch, git_commit_subjects,
#   git_working_tree_clean, git_is_linear_history, git_has_merge_commit,
#   git_ref_exists <ref>, git_branch_merged <branch>, git_in_history <ref>,
#   git_tracked <path>, git_show <path>, g <raw git args...>
#
# For non-git tracks, just check files/command output with assert_true, e.g.:
#   assert_true "docker is configured" test -f "$SANDBOX_DIR/Dockerfile"

assert_true "example.txt exists" git_tracked example.txt

finish   # prints summary and sets the exit code — must be the last line
