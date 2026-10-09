#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
cp -R "$REPO_ROOT/tracks/grpc/fixtures/." "$HERE/starter/." "$SANDBOX_DIR/"
printf 'node_modules/\n' | put .gitignore
# This challenge is about the client; npm start still runs the server.
in_sandbox npm pkg set scripts.client="node client.js"

npm_install_sandbox
sb_commit_all "Library gRPC service; client to write"
