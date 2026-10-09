#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"

if ! git subtree --help >/dev/null 2>&1; then
  echo "This challenge needs 'git subtree' (usually bundled with git) — not found." >&2
  exit 1
fi

# The upstream library you'll vendor with subtree.
UPSTREAM="${SANDBOX_DIR}-upstream-lib"
rm -rf "$UPSTREAM"
git init -q -b main "$UPSTREAM"
git -C "$UPSTREAM" config user.name  "Lib Author"
git -C "$UPSTREAM" config user.email "lib@onboarding.local"
git -C "$UPSTREAM" config commit.gpgsign false
git -C "$UPSTREAM" config core.autocrlf false
printf 'export const helper = () => 42;\n' > "$UPSTREAM/helper.js"
git -C "$UPSTREAM" add helper.js
git -C "$UPSTREAM" commit -q -m "Add helper 1.0.0"

sandbox_reset
sb_commit "app.js" "import './vendor/lib/helper.js';" "Add app entrypoint"

sb_stash_note upstream "$UPSTREAM"
echo "Upstream library repo: $UPSTREAM"
