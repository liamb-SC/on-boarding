#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

ans() { grep -E "^$1=" "$SANDBOX_DIR/answers.txt" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '[:space:]'; }

true_files="$(g diff --name-only main feature | wc -l | tr -d ' ')"
true_ahead="$(g rev-list --count main..feature)"
true_behind="$(g rev-list --count feature..main)"
true_base="$(g merge-base main feature)"

a_base_full="$(g rev-parse "$(ans merge_base)" 2>/dev/null)"

assert_eq "files that differ between main and feature (git diff --name-only)" "$true_files"  "$(ans files_differ)"
assert_eq "commits on feature but not main (git rev-list main..feature)"      "$true_ahead"  "$(ans ahead)"
assert_eq "commits on main but not feature (git rev-list feature..main)"      "$true_behind" "$(ans behind)"
assert_eq "the merge-base of main and feature (git merge-base)"               "$true_base"   "$a_base_full"
finish
