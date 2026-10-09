#!/usr/bin/env bash
# localstack.sh — run the LocalStack container the AWS track talks to.
#
#   ./localstack.sh start     start it (or reuse it) and wait until it's healthy
#   ./localstack.sh status    is it up? which version, which services?
#   ./localstack.sh logs      the last 50 lines of its logs
#   ./localstack.sh restart   stop + start: wipes every resource you created
#   ./localstack.sh stop      remove the container (its state goes with it)
#
# LocalStack keeps everything in memory, so state lasts until the container
# stops. One container serves every challenge in the track.
#
# Settings (env vars):
#   LOCALSTACK_IMAGE       default localstack/localstack:4.14, the last free
#                          community image. Newer tags need an auth token.
#   LOCALSTACK_AUTH_TOKEN  passed through if set (only needed for newer images)
#   AWS_ENDPOINT_URL       default http://localhost:4566

set -uo pipefail

NAME=onboard-localstack
IMAGE="${LOCALSTACK_IMAGE:-localstack/localstack:4.14}"
ENDPOINT="${AWS_ENDPOINT_URL:-http://localhost:4566}"
WAIT_SECS=120

# healthy [verbose] — 0 if LocalStack answers its health endpoint
healthy() {
  node -e '
    const [url, verbose] = process.argv.slice(1);
    fetch(url + "/_localstack/health", { signal: AbortSignal.timeout(3000) })
      .then((r) => r.json())
      .then((h) => {
        if (!h || typeof h.services !== "object") process.exit(1);
        if (verbose) {
          console.log(`LocalStack ${h.version ?? "?"} (${h.edition ?? "?"} edition) at ${url}`);
          const up = Object.entries(h.services).filter(([, s]) => s === "running" || s === "available");
          console.log(`services: ${up.map(([n]) => n).sort().join(" ")}`);
        }
      })
      .catch(() => process.exit(1));
  ' "$ENDPOINT" "${1:-}" 2>/dev/null
}

die() { printf '✗ %s\n' "$1" >&2; shift; for l in "$@"; do printf '  %s\n' "$l" >&2; done; exit 1; }

need_docker() {
  command -v docker >/dev/null 2>&1 ||
    die "Docker is not installed, and nothing is answering at $ENDPOINT." \
        "Install Docker (https://docs.docker.com/get-docker/) and try again."
  docker info >/dev/null 2>&1 ||
    die "Docker is installed but its daemon isn't reachable (is Docker Desktop running?)." \
        "Start Docker, then run: ./localstack.sh start"
}

container_state() { docker inspect -f '{{.State.Status}}' "$NAME" 2>/dev/null; }

start() {
  if healthy; then healthy verbose; return 0; fi
  need_docker
  case "$(container_state)" in
    running) ;;
    "")
      printf 'Starting %s (%s)...\n' "$NAME" "$IMAGE"
      local token=()
      [ -n "${LOCALSTACK_AUTH_TOKEN:-}" ] && token=(-e "LOCALSTACK_AUTH_TOKEN=$LOCALSTACK_AUTH_TOKEN")
      # The Docker socket lets LocalStack start a container per Lambda function.
      docker run -d --name "$NAME" -p 4566:4566 \
        -v /var/run/docker.sock:/var/run/docker.sock \
        ${token[@]+"${token[@]}"} "$IMAGE" >/dev/null ||
        die "docker run failed (see above)." \
            "Is port 4566 already in use? Can Docker pull $IMAGE?"
      ;;
    *)
      printf 'Starting the existing %s container...\n' "$NAME"
      docker start "$NAME" >/dev/null || die "docker start $NAME failed." "Try: ./localstack.sh restart"
      ;;
  esac

  printf 'Waiting for LocalStack to be ready'
  local i
  for ((i = 0; i < WAIT_SECS; i += 2)); do
    if healthy; then printf '\n'; healthy verbose; return 0; fi
    if [ "$(container_state)" != running ]; then
      printf '\n'
      docker logs --tail 20 "$NAME" 2>&1 | sed 's/^/  | /' >&2
      die "The LocalStack container stopped (logs above)." \
          "If it mentions a license or auth token: newer images need LOCALSTACK_AUTH_TOKEN," \
          "or unset LOCALSTACK_IMAGE to use the free localstack/localstack:4.14." \
          "Then: ./localstack.sh restart"
    fi
    printf '.'
    sleep 2
  done
  printf '\n'
  die "LocalStack didn't become healthy within ${WAIT_SECS}s." "Check: ./localstack.sh logs"
}

stop() {
  command -v docker >/dev/null 2>&1 || return 0
  docker rm -f "$NAME" >/dev/null 2>&1 && printf 'Removed %s.\n' "$NAME"
  return 0
}

case "${1:-status}" in
  start)   start ;;
  status)  healthy verbose || die "LocalStack is not running at $ENDPOINT." "Start it: ./localstack.sh start" ;;
  health)  healthy ;;
  logs)    need_docker; docker logs --tail 50 "$NAME" ;;
  restart) need_docker; stop; start ;;
  stop)    stop ;;
  *)       printf 'usage: %s start|status|logs|restart|stop\n' "$0" >&2; exit 1 ;;
esac
