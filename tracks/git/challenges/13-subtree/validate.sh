#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

assert_true     "vendor/lib/helper.js is committed as a real file" git_tracked vendor/lib/helper.js
assert_contains "it has the upstream content" "$(git_show vendor/lib/helper.js)" "helper"
# Unlike a submodule, subtree stores real files — there must be NO gitlink/.gitmodules.
assert_false    "it is NOT a submodule (no .gitmodules)" git_tracked .gitmodules
assert_true     "the subtree added at least one commit" test "$(git_log_count)" -ge 2
assert_true     "working tree is clean" git_working_tree_clean
finish
