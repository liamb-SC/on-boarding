#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"

assert_false "package-lock.json is gone (one package manager, one lockfile)" test -e "$SANDBOX_DIR/package-lock.json"
assert_false "package-lock.json is not committed either" git_tracked package-lock.json
assert_true  "yarn.lock exists (installed with yarn)" test -f "$SANDBOX_DIR/yarn.lock"
assert_contains "packageManager pins yarn 1 (so corepack picks the right yarn)" \
             "$(json package.json 'j.packageManager')" "yarn@1."
assert_eq    "@demo/cli's range for @demo/utils targets major version 1 (the local package)" "1" \
             "$(json apps/cli/package.json '(j.dependencies?.["@demo/utils"] || "").replace(/^[^0-9]*/, "").split(".")[0]')"
assert_true  "node_modules/@demo/utils is the symlinked workspace, not a download" \
             test -L "$SANDBOX_DIR/node_modules/@demo/utils"
assert_contains "root start script uses yarn workspace" "$(json package.json 'j.scripts?.start')" "yarn workspace"
assert_eq    "yarn start (from the root) prints the message" "YARN WORKSPACES!" \
             "$(in_sandbox yarn --silent start 2>/dev/null | tail -n1)"
finish
