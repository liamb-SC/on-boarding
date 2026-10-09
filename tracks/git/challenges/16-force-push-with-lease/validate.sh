#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

ORIGIN="${SANDBOX_DIR}-origin.git"
feat="$(git -C "$ORIGIN" show feature:feature.txt 2>/dev/null)"

assert_true         "origin still has a feature branch" git -C "$ORIGIN" rev-parse --verify --quiet feature
assert_contains     "your typo fix reached origin (feature.txt says 'width')" "$feat" "width"
assert_not_contains "the old typo 'widht' is gone from origin" "$feat" "widht"
assert_true         "the teammate's review-fix.txt SURVIVED on origin — --force would have destroyed it" \
                    git -C "$ORIGIN" cat-file -e feature:review-fix.txt
finish
