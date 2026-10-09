#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
cp -R "$REPO_ROOT/tracks/react/fixtures/." "$HERE/starter/." "$SANDBOX_DIR/"
printf 'node_modules/\n.onboard-tests/\ndist/\n' | put .gitignore
in_sandbox npm pkg set 'dependencies.@mui/material=^9.0.0' 'dependencies.@emotion/react=^11.14.0' 'dependencies.@emotion/styled=^11.14.0' \
  'dependencies.class-variance-authority=^0.7.1' 'dependencies.clsx=^2.1.1' 'dependencies.tailwind-merge=^3.3.0'

npm_install_sandbox
sb_commit_all "A shadcn button and an MUI newsletter box"
