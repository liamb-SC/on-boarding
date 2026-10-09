#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"

BUNDLE="$SANDBOX_DIR/dist/shop.mjs"
rm -f "$BUNDLE"
assert_true "npm run build succeeds" in_sandbox npm run build --silent
bundle="$(cat "$BUNDLE" 2>/dev/null)"

assert_eq    "the bundle runs and prints £19.99" "£19.99" "$(node "$BUNDLE" 2>/dev/null)"
assert_not_contains "the heavy chart engine was shaken out of the bundle" "$bundle" "HEAVY_CHART_ENGINE"
assert_not_contains "renderChart (unused) is not in the bundle" "$bundle" "renderChart"
assert_not_contains "no CommonJS wrappers in the bundle (everything is ES modules)" "$bundle" "__commonJS"
assert_eq    "@demo/utils declares \"sideEffects\": false" "false" \
             "$(json packages/utils/package.json 'j.sideEffects')"
assert_contains "@demo/utils still exports renderChart (you shook it out, not deleted it)" \
             "$(cat "$SANDBOX_DIR/packages/utils/index.js" 2>/dev/null)" "chart"
assert_contains "chart.js still has its side effect (the fix is sideEffects, not editing it)" \
             "$(cat "$SANDBOX_DIR/packages/utils/chart.js" 2>/dev/null)" "globalThis.chartEngines"
finish
