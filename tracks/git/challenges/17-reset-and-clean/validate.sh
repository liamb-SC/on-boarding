#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

assert_true  "working tree is completely clean (nothing staged, modified or untracked)" git_working_tree_clean
assert_eq    "you didn't just commit the mess (still 2 commits)" "2" "$(git_log_count)"
assert_eq    "app.js is restored to the committed version" "console.log('v1');" "$(cat "$SANDBOX_DIR/app.js" 2>/dev/null)"
assert_true  "the untracked debug.log was removed" test ! -e "$SANDBOX_DIR/debug.log"
assert_true  "the untracked build/ directory was removed" test ! -e "$SANDBOX_DIR/build"
finish
