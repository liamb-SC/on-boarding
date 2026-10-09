#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/infrastructure/docker.sh"

df="$SANDBOX_DIR/Dockerfile"
di="$SANDBOX_DIR/.dockerignore"
# Dockerfile instructions, comments stripped, keywords upper-cased
instr() { sed -e 's/#.*//' "$df" 2>/dev/null | awk 'NF { $1 = toupper($1); print }'; }

assert_true  "Dockerfile exists" test -f "$df"
assert_ge    "Dockerfile has at least two stages (two FROM lines)" 2 "$(instr | grep -c '^FROM ')"
assert_true  "the build stage is named (FROM ... AS build)" grep -qiE '^FROM .+ AS [a-z0-9_-]+' <(instr)
assert_true  "the final stage copies from the build stage (COPY --from=...)" grep -qiE '^COPY .*--from=' <(instr)
assert_true  "dependencies are installed from the lockfile (RUN npm ci)" grep -qE '^RUN .*npm ci' <(instr)
last_user="$(instr | awk '$1 == "USER" { u = $2 } END { print u }')"
assert_true  "the image runs as a non-root USER" test -n "$last_user" -a "${last_user%%:*}" != root -a "${last_user%%:*}" != 0
assert_true  "CMD uses the exec form: CMD [\"node\", ...]" grep -qE '^CMD +\[' <(instr)
assert_true  ".dockerignore exists" test -f "$di"
assert_true  ".dockerignore keeps node_modules out of the build context" grep -qE '^(\*\*/|/)?node_modules/?$' "$di"
assert_true  ".dockerignore keeps .git out of the build context" grep -qE '^(\*\*/|/)?\.git/?$' "$di"

if require_docker_daemon; then
  img="onboard-infra-01:latest"; name="onboard-infra-01"
  docker rm -f "$name" >/dev/null 2>&1
  build_log="$(docker build -t "$img" "$SANDBOX_DIR" 2>&1)"
  assert_true "docker build succeeds" test $? -eq 0
  if docker image inspect "$img" >/dev/null 2>&1; then
    user="$(docker image inspect -f '{{.Config.User}}' "$img")"
    assert_true "the image's configured user is not root (got '${user:-root}')" \
      test -n "$user" -a "$user" != root -a "$user" != 0
    size_mb=$(( $(docker image inspect -f '{{.Size}}' "$img") / 1000000 ))
    assert_true "the image is small: under 300 MB (got ${size_mb} MB; try a -alpine or -slim base)" test "$size_mb" -lt 300
    leaked="$(docker run --rm --entrypoint sh "$img" -c \
      'find / -xdev -type d -path "*node_modules/esbuild" 2>/dev/null | head -1' 2>&1)"
    assert_eq "the final image has no build-only deps (esbuild) in it" "" "$leaked"

    docker run -d --name "$name" -p 127.0.0.1::3000 "$img" >/dev/null 2>&1
    port="$(docker port "$name" 3000/tcp 2>/dev/null | head -1 | sed 's/.*://')"
    assert_true "the container starts and answers on port 3000" wait_for_http "http://127.0.0.1:${port:-0}/health" 20
    assert_contains "GET /health returns {\"status\":\"ok\"}" "$(curl -fsS "http://127.0.0.1:${port:-0}/health" 2>/dev/null)" '"status":"ok"'
    assert_contains "GET / returns the hello message" "$(curl -fsS "http://127.0.0.1:${port:-0}/" 2>/dev/null)" 'hello from a container'
    t0=$(date +%s); docker stop -t 10 "$name" >/dev/null 2>&1; t1=$(date +%s)
    assert_true "the container stops promptly on SIGTERM (under 5s)" test $((t1 - t0)) -lt 5
    docker rm -f "$name" >/dev/null 2>&1
  else
    printf '%s\n' "$build_log" | tail -15 | sed 's/^/    /'
  fi
fi
finish
