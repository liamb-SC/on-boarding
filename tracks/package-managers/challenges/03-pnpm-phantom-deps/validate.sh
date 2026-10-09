#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"

assert_contains "pnpm-workspace.yaml lists packages/*" "$(cat "$SANDBOX_DIR/pnpm-workspace.yaml" 2>/dev/null)" "packages/*"
assert_contains "pnpm-workspace.yaml lists apps/*" "$(cat "$SANDBOX_DIR/pnpm-workspace.yaml" 2>/dev/null)" "apps/*"
assert_true  "pnpm-lock.yaml exists (installed with pnpm)" test -f "$SANDBOX_DIR/pnpm-lock.yaml"
assert_false "no package-lock.json (one package manager per repo)" test -e "$SANDBOX_DIR/package-lock.json"
assert_true  "node_modules/.pnpm exists (pnpm's content-addressed store layout)" test -d "$SANDBOX_DIR/node_modules/.pnpm"
assert_contains "@demo/ui depends on @demo/utils via the workspace: protocol" \
             "$(json packages/ui/package.json 'j.dependencies?.["@demo/utils"]')" "workspace:"
assert_contains "@demo/web depends on @demo/ui via the workspace: protocol" \
             "$(json apps/web/package.json 'j.dependencies?.["@demo/ui"]')" "workspace:"
assert_contains "@demo/web now DECLARES its direct use of @demo/utils (phantom dep fixed)" \
             "$(json apps/web/package.json 'j.dependencies?.["@demo/utils"]')" "workspace:"
assert_contains "apps/web/index.js still requires @demo/utils directly" \
             "$(cat "$SANDBOX_DIR/apps/web/index.js")" "require('@demo/utils')"
assert_eq    "pnpm --filter @demo/web start works" \
             '<h1 id="hello-world">Hello World</h1> page-two' \
             "$(in_sandbox pnpm --silent --filter @demo/web start 2>/dev/null)"
finish
