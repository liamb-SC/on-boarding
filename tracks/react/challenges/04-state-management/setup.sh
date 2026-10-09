#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
cp -R "$REPO_ROOT/tracks/react/fixtures/." "$HERE/starter/." "$SANDBOX_DIR/"
printf 'node_modules/\n.onboard-tests/\ndist/\n' | put .gitignore
in_sandbox npm pkg set 'dependencies.@reduxjs/toolkit=^2.9.0' 'dependencies.react-redux=^9.2.0' 'dependencies.zustand=^5.0.8'

npm_install_sandbox
sb_commit_all "Café cart, one UI and two empty stores"
