#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/infrastructure/docker.sh"

run_checks node "$(dirname "${BASH_SOURCE[0]}")/check.mjs"

if require_docker_daemon; then
  dc() { (cd "$SANDBOX_DIR" && docker compose "$@"); }
  visits() { curl -fsS localhost:8080/visits 2>/dev/null | node -e \
    'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).visits??""))}catch{}})'; }

  printf '  %s(starting the stack: docker compose up -d --build --wait ...)%s\n' "$DIM" "$RESET"
  up_log="$(dc up -d --build --wait 2>&1)"; rc=$?
  assert_true "docker compose up --wait succeeds (both services healthy/running)" test "$rc" -eq 0
  [ "$rc" -eq 0 ] || printf '%s\n' "$up_log" | tail -8 | sed 's/^/    /'
  a="$(visits)"; b="$(visits)"
  assert_true "GET localhost:8080/visits returns a count" test -n "$a"
  assert_eq   "the count goes up by one per request" "$((${a:-0} + 1))" "${b:-x}"

  dc restart api >/dev/null 2>&1; wait_for_http localhost:8080/health 20
  c="$(visits)"
  assert_eq   "the count survives restarting the api (state lives in redis)" "$((${b:-0} + 1))" "${c:-x}"

  dc down >/dev/null 2>&1; dc up -d --wait >/dev/null 2>&1; wait_for_http localhost:8080/health 20
  d="$(visits)"
  assert_eq   "the count survives docker compose down + up (named volume)" "$((${c:-0} + 1))" "${d:-x}"
  dc down >/dev/null 2>&1
fi
finish
