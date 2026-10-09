#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/infrastructure/docker.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm
need docker "Install Docker Desktop (enable WSL integration) or Docker Engine: https://docs.docker.com/get-docker/"

sandbox_reset
cp -R "$REPO_ROOT/tracks/infrastructure/fixtures/hello-api/." "$SANDBOX_DIR/"
printf 'node_modules/\ndist/\n' | put .gitignore

# A local install, like any dev machine has: node_modules/ is sitting right there
# for a careless `COPY . .` to drag into the image.
npm_install_sandbox
sb_commit_all "hello-api: a tiny JSON service"
docker_hint
