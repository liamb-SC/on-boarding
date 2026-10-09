#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

assert_true  "the typo branch was renamed to feature-login" git_ref_exists refs/heads/feature-login
assert_false "the old 'feautre-login' name is gone" git_ref_exists refs/heads/feautre-login
assert_true  "feature-login still has its commit (login.js)" g cat-file -e feature-login:login.js
assert_true  "the current branch was renamed to develop" git_ref_exists refs/heads/develop
assert_false "the old 'temp-wip' name is gone" git_ref_exists refs/heads/temp-wip
assert_eq    "you are now on the develop branch" "develop" "$(git_current_branch)"
finish
