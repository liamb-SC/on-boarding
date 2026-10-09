#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"

# A separate "library" repo you'll embed as a submodule. Kept alongside the
# sandbox (also git-ignored) and rebuilt on every start/reset.
UPSTREAM="${SANDBOX_DIR}-upstream-lib"
rm -rf "$UPSTREAM"
git init -q -b main "$UPSTREAM"
git -C "$UPSTREAM" config user.name  "Lib Author"
git -C "$UPSTREAM" config user.email "lib@onboarding.local"
git -C "$UPSTREAM" config commit.gpgsign false
git -C "$UPSTREAM" config core.autocrlf false
printf 'export const version = "1.0.0";\n' > "$UPSTREAM/index.js"
git -C "$UPSTREAM" add index.js
git -C "$UPSTREAM" commit -q -m "Release lib 1.0.0"

# Your application repo.
sandbox_reset
sb_commit "app.js" "import './vendor/lib';" "Add app entrypoint"

# Stash the upstream path so the README can hand you a copy-paste command.
sb_stash_note upstream "$UPSTREAM"

echo "Upstream library repo: $UPSTREAM"
