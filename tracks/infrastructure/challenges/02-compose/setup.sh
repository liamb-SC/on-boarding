#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/infrastructure/docker.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm
need docker "Install Docker Desktop (enable WSL integration) or Docker Engine: https://docs.docker.com/get-docker/"

# Stop a stack left over from a previous attempt before wiping its files.
if [ -f "$SANDBOX_DIR/compose.yaml" ] && docker_up; then
  (cd "$SANDBOX_DIR" && docker compose down -v >/dev/null 2>&1)
fi

sandbox_reset
cp -R "$REPO_ROOT/tracks/infrastructure/fixtures/visits-api/." "$SANDBOX_DIR/"
printf 'node_modules/\n' | put .gitignore
put compose.yaml <<'YAML'
# Two services: the API (built from ./Dockerfile) and Redis.
# Fill in the TODOs. Reference: https://docs.docker.com/reference/compose-file/services/
services:
  api:
    # TODO: build the image from this directory
    # TODO: publish container port 3000 on host port 8080
    # TODO: tell the API where Redis is (REDIS_HOST)
    # TODO: only start once redis is *healthy*, not just started

  redis:
    image: redis:7-alpine
    # TODO: a healthcheck that runs `redis-cli ping`
    # TODO: keep /data in a named volume so the count survives `docker compose down`

# TODO: declare the named volume
YAML

npm_install_sandbox   # yaml, used by the validator to read compose.yaml
sb_commit_all "visits-api + a compose file to finish"
docker_hint
