#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm
need yarn "Enable it with: corepack enable yarn   (or: npm install -g yarn)"

sandbox_reset

put .gitignore <<'TXT'
node_modules/
TXT
put package.json <<'JSON'
{
  "name": "demo-monorepo",
  "private": true,
  "workspaces": ["packages/*", "apps/*"]
}
JSON
put packages/utils/package.json <<'JSON'
{
  "name": "@demo/utils",
  "version": "1.4.0",
  "main": "index.js"
}
JSON
put packages/utils/index.js <<'JS'
exports.shout = (s) => `${s.toUpperCase()}!`;
JS
put apps/cli/package.json <<'JSON'
{
  "name": "@demo/cli",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@demo/utils": "^1.4.0"
  }
}
JSON
put apps/cli/index.js <<'JS'
const { shout } = require('@demo/utils');
console.log(shout('yarn workspaces'));
JS

# The repo has been on npm, so it has an npm lockfile.
(cd "$SANDBOX_DIR" && npm install --package-lock-only --silent >/dev/null 2>&1) \
  || { echo "✗ could not generate package-lock.json with npm" >&2; exit 1; }

# Then someone bumped the dependency range past what the local package provides.
# A workspace dependency only links if the local version satisfies the range;
# otherwise the package manager goes to the npm registry for it.
sed -i.bak 's/"\^1.4.0"/"^2.0.0"/' "$SANDBOX_DIR/apps/cli/package.json" && rm -f "$SANDBOX_DIR/apps/cli/package.json.bak"
sb_commit_all "Monorepo on npm"
