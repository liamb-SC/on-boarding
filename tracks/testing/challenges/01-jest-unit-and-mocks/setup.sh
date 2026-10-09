#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
cp -R "$(dirname "${BASH_SOURCE[0]}")/starter/." "$SANDBOX_DIR/"
printf 'node_modules/\n' | put .gitignore
put package.json <<'JSON'
{
  "name": "cart",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "^30.0.0"
  }
}
JSON

npm_install_sandbox
sb_commit_all "Shopping cart with one lonely test"
