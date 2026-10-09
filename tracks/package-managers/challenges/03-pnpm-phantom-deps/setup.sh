#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need pnpm "Enable it with: corepack enable pnpm   (or: npm install -g pnpm)"

sandbox_reset

# An npm-style monorepo about to move to pnpm. apps/web uses @demo/utils but
# only declares @demo/ui (which depends on utils). npm's flat node_modules
# hides that mistake; pnpm's strict layout will expose it.
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
  "version": "1.0.0",
  "main": "index.js"
}
JSON
put packages/utils/index.js <<'JS'
exports.slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
JS
put packages/ui/package.json <<'JSON'
{
  "name": "@demo/ui",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "@demo/utils": "1.0.0"
  }
}
JSON
put packages/ui/index.js <<'JS'
const { slugify } = require('@demo/utils');
exports.title = (s) => `<h1 id="${slugify(s)}">${s}</h1>`;
JS
put apps/web/package.json <<'JSON'
{
  "name": "@demo/web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "@demo/ui": "1.0.0"
  }
}
JSON
put apps/web/index.js <<'JS'
const { title } = require('@demo/ui');
const { slugify } = require('@demo/utils'); // used directly, but never declared!
console.log(title('Hello World'), slugify('Page Two'));
JS
sb_commit_all "Initial npm monorepo"
