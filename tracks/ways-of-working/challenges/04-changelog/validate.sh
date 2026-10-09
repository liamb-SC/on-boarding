#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"
run_checks node "$(dirname "${BASH_SOURCE[0]}")/check.mjs"

assert_eq    "package.json version is bumped to 2.0.0" "2.0.0" "$(json package.json 'j.version')"
assert_true  "the release is tagged v2.0.0" git_ref_exists "refs/tags/v2.0.0"
assert_contains "the v2.0.0 tag includes the new changelog section" \
  "$(g show v2.0.0:CHANGELOG.md 2>/dev/null)" "## [2.0.0]"
assert_eq    "the v2.0.0 tag includes the version bump" "2.0.0" \
  "$(g show v2.0.0:package.json 2>/dev/null | node -e 'try{process.stdout.write(JSON.parse(require("fs").readFileSync(0,"utf8")).version)}catch{}')"
assert_true  "v1.3.0 is an ancestor of v2.0.0 (you tagged on top of the existing history)" \
  g merge-base --is-ancestor "$(cat "$SANDBOX_DIR/.git/note_base_tag" 2>/dev/null)" v2.0.0
assert_true  "working tree is clean (everything committed)" git_working_tree_clean
finish
