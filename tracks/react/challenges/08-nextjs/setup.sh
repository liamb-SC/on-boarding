#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20.9+ (https://nodejs.org or nvm)."
need npm

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
# Only the shared package.json (React + the test tools the validator uses).
# Next.js replaces Vite as the dev server and build tool.
cp "$REPO_ROOT/tracks/react/fixtures/package.json" "$SANDBOX_DIR/"
cp -R "$HERE/starter/." "$SANDBOX_DIR/"
printf 'node_modules/\n.onboard-tests/\n.next/\nnext-env.d.ts\n' | put .gitignore
in_sandbox npm pkg set name=gadget-shop 'dependencies.next=^16.0.0' \
  'scripts.dev=next dev' 'scripts.build=next build' 'scripts.start=next start'
in_sandbox npm pkg delete scripts.test

npm_install_sandbox
sb_commit_all "Next.js shop with a client-side products page"
