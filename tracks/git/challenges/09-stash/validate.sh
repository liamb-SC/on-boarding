#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

work_app="$(cat "$SANDBOX_DIR/app.txt" 2>/dev/null)"

assert_eq   "you added the hotfix commit (now 2 commits)" "2" "$(git_log_count)"
assert_true "hotfix.txt was committed" git_tracked hotfix.txt
assert_contains "your WIP was restored to the working tree" "$work_app" "v2 WIP"
assert_eq   "the committed app.txt is still v1 (WIP not committed)" "v1" "$(git_show app.txt)"
assert_true "the stash is empty (you popped it back)" test -z "$(g stash list)"
finish
