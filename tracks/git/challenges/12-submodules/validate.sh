#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

assert_true     ".gitmodules is committed" git_tracked .gitmodules
assert_contains ".gitmodules points at vendor/lib" "$(git_show .gitmodules)" "vendor/lib"
# A submodule is recorded as a gitlink (mode 160000), not normal files.
assert_contains "vendor/lib is registered as a submodule (gitlink)" \
  "$(g ls-files --stage vendor/lib)" "160000"
assert_true     "the submodule is checked out (has real content)" test -f "$SANDBOX_DIR/vendor/lib/index.js"
assert_true     "working tree is clean" git_working_tree_clean
finish
