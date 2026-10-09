#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
cp -R "$HERE/starter/." "$SANDBOX_DIR/"
cp "$HERE/mock/auth-server.js" "$SANDBOX_DIR/auth-server.js"
printf 'node_modules/\n' | put .gitignore

npm_install_sandbox
sb_commit_all "Notes app and a mock authorization server"
