#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

assert_false    "the backdoor.js file is gone from the latest tree" git_tracked backdoor.js
assert_true     "the earlier feature.js is untouched" git_tracked feature.js
assert_true     "the later polish.js work is preserved" git_tracked polish.js
assert_contains "you undid it with a revert (a 'Revert' commit exists)" "$(git_commit_subjects)" "Revert"
assert_ge       "history grew — you added a commit rather than erasing one" 5 "$(git_log_count)"
assert_true     "working tree is clean" git_working_tree_clean
finish
