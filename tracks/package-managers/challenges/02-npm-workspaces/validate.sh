#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"

ws="$(json package.json 'j.workspaces')"
assert_contains "root package.json declares packages/* as workspaces" "$ws" "packages/*"
assert_contains "root package.json declares apps/* as workspaces" "$ws" "apps/*"
assert_true  "@demo/cli declares its dependency on @demo/utils" \
             test -n "$(json apps/cli/package.json 'j.dependencies?.["@demo/utils"]')"
assert_true  "node_modules/@demo/utils is a symlink (linked, not downloaded)" \
             test -L "$SANDBOX_DIR/node_modules/@demo/utils"
assert_true  "there is one lockfile, at the root" test -f "$SANDBOX_DIR/package-lock.json"
assert_false "no stray lockfile inside apps/cli" test -e "$SANDBOX_DIR/apps/cli/package-lock.json"
assert_false "no stray lockfile inside packages/utils" test -e "$SANDBOX_DIR/packages/utils/package-lock.json"
assert_contains "root has a start script that targets the @demo/cli workspace" \
             "$(json package.json 'j.scripts?.start')" "@demo/cli"
assert_eq    "npm start (from the root) prints the greeting" "Hello, StepChange!" \
             "$(in_sandbox npm start --silent 2>/dev/null)"
finish
