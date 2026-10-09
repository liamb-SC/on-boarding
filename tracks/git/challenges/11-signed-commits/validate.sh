#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

raw="$(g cat-file commit HEAD 2>/dev/null)"
verdict="$(g log -1 --format='%G?' 2>/dev/null)"

assert_true     "release.txt was committed" git_tracked release.txt
assert_contains "the latest commit carries a signature" "$raw" "SIGNATURE"
assert_eq       "the signature verifies as good (git shows 'G')" "G" "$verdict"
assert_contains "the commit message mentions the release" "$(git_commit_subjects | head -1)" "release"
finish
