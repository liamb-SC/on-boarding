#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

sandbox_reset
cp "$REPO_ROOT/tracks/testing/fixtures/notes-api.mjs" "$SANDBOX_DIR/"
cp "$REPO_ROOT/tracks/testing/fixtures/shop-session.har" "$SANDBOX_DIR/"
put package.json <<'JSON'
{
  "name": "notes-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "ID_LOG=.git/served-ids node notes-api.mjs"
  }
}
JSON

# Part 1: questions about shop-session.har. Replace each null.
put answers.json <<'JSON'
{
  "requestCount": null,
  "slowestPath": null,
  "slowestWaitMs": null,
  "failedPath": null,
  "largestPath": null,
  "cookieName": null,
  "leaks": []
}
JSON
sb_commit_all "A HAR to investigate, and an app to record"
