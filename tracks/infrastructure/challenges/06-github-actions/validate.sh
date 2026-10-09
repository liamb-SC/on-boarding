#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"
run_checks node "$(dirname "${BASH_SOURCE[0]}")/check.mjs"
assert_true "npm test passes locally (what the job will run)" in_sandbox npm test --silent
assert_true "the workflow is committed" git_tracked .github/workflows/ci.yml
assert_true "working tree is clean (everything committed)" git_working_tree_clean
finish
