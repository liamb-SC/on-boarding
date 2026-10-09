#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset

# A small tool with two classic mistakes in its package.json:
#   - "ms": "*"     accepts ANY future version, including breaking majors
#   - esbuild listed as a runtime dependency, though it's only a build tool
put package.json <<'JSON'
{
  "name": "duration-tool",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "ms": "*",
    "esbuild": "^0.28.0"
  }
}
JSON
put index.js <<'JS'
const ms = require('ms');
console.log(ms('2h'));
JS
sb_commit_all "Initial duration tool"
