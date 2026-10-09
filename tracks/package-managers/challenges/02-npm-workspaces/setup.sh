#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset

# A monorepo that isn't wired up as one yet: the root knows nothing about its
# packages, and the CLI requires @demo/utils without declaring it.
put .gitignore <<'TXT'
node_modules/
TXT
put package.json <<'JSON'
{
  "name": "demo-monorepo",
  "private": true
}
JSON
put packages/utils/package.json <<'JSON'
{
  "name": "@demo/utils",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "node -e \"require('assert').strictEqual(require('./').greet('x'), 'Hello, x!')\""
  }
}
JSON
put packages/utils/index.js <<'JS'
exports.greet = (name) => `Hello, ${name}!`;
JS
put apps/cli/package.json <<'JSON'
{
  "name": "@demo/cli",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node index.js"
  }
}
JSON
put apps/cli/index.js <<'JS'
const { greet } = require('@demo/utils');
console.log(greet('StepChange'));
JS
sb_commit_all "Initial monorepo layout"
