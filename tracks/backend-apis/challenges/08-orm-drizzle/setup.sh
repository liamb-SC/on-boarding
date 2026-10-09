#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
cp -R "$HERE/starter/." "$SANDBOX_DIR/"
printf 'node_modules/\n*.db\n' | put .gitignore

npm_install_sandbox
# Generate the first migration (the authors table) with the installed
# drizzle-kit, so its format always matches, then apply it to local.db.
in_sandbox npx drizzle-kit generate --name init >/dev/null 2>&1 \
  || { printf '✗ drizzle-kit generate failed. Run: ./onboard reset <challenge>\n' >&2; exit 1; }
in_sandbox node src/migrate.js >/dev/null
sb_commit_all "Bookshop DB with Drizzle: authors table"
