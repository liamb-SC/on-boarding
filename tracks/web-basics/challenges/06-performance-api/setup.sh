#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

sandbox_reset
cp -R "$(dirname "${BASH_SOURCE[0]}")/starter/." "$SANDBOX_DIR/"
cp "$REPO_ROOT/tracks/web-basics/fixtures/static-server.mjs" "$SANDBOX_DIR/server.mjs"
put package.json <<'JSON'
{
  "name": "sales-report",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "report": "node run.js",
    "start": "node server.mjs"
  }
}
JSON

put answers.json <<'JSON'
{
  "slowerStep": "",
  "longTaskMs": null,
  "devtoolsTrack": ""
}
JSON
sb_commit_all "Slow sales report"
