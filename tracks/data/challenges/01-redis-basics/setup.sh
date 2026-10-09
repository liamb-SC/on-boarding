#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need docker "Install Docker Desktop (or Docker Engine) to run Redis locally."

if ! docker info >/dev/null 2>&1; then
  printf '✗ Docker is installed but its daemon is not reachable. Start Docker, then run:\n  ./onboard reset data/01\n' >&2
  exit 1
fi

# Start from nothing: remove any Redis left over from a previous attempt.
docker rm -f onboard-redis >/dev/null 2>&1 || true

sandbox_reset
put redis-cli.sh <<'SH'
#!/usr/bin/env bash
# Open redis-cli inside the onboard-redis container (extra args are passed through).
exec docker exec -it onboard-redis redis-cli "$@"
SH
chmod +x "$SANDBOX_DIR/redis-cli.sh"
sb_commit_all "Redis scratchpad"
printf 'Now start Redis: docker run -d --name onboard-redis -p 6379:6379 redis:7-alpine\n'
