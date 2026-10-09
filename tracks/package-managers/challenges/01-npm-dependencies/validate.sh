#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"

assert_eq    "ms is pinned to exactly 2.1.3 (no ^, ~ or *)" "2.1.3" "$(json package.json 'j.dependencies?.ms')"
assert_eq    "esbuild is no longer a runtime dependency" "" "$(json package.json 'j.dependencies?.esbuild')"
assert_true  "esbuild is a devDependency" test -n "$(json package.json 'j.devDependencies?.esbuild')"
assert_eq    "package.json has a start script that runs index.js" "node index.js" "$(json package.json 'j.scripts?.start')"
assert_true  "node_modules matches package.json + lockfile (npm ls is happy)" in_sandbox npm ls --silent
assert_eq    "npm start prints 7200000" "7200000" "$(in_sandbox npm start --silent 2>/dev/null)"
assert_true  "package-lock.json is committed" git_tracked package-lock.json
assert_contains "node_modules is in .gitignore" "$(git_show .gitignore)" "node_modules"
assert_eq    "node_modules is NOT committed" "" "$(g ls-files node_modules | head -1)"
assert_true  "working tree is clean (everything committed)" git_working_tree_clean
finish
