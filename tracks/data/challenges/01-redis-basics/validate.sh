#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  assert_true "Docker is installed and its daemon is running" false
  finish
fi

running="$(docker inspect -f '{{.State.Running}}' onboard-redis 2>/dev/null)"
assert_eq "a container named onboard-redis is running" "true" "$running"
[ "$running" = "true" ] || finish

# redis-cli prints raw values when it isn't attached to a terminal.
rc() { docker exec onboard-redis redis-cli "$@" 2>/dev/null; }

assert_eq "greeting = 'hello redis'" "hello redis" "$(rc GET greeting)"
assert_eq "greeting has no expiry (TTL -1)" "-1" "$(rc TTL greeting)"

assert_eq "page:home:views is a counter at 3" "3" "$(rc GET page:home:views)"

ttl="$(rc TTL session:abc123)"
assert_eq "session:abc123 = alice" "alice" "$(rc GET session:abc123)"
assert_true "session:abc123 expires within the hour (TTL ${ttl:-missing})" \
  test "${ttl:-0}" -gt 0 -a "${ttl:-0}" -le 3600

assert_eq "user:42 is a hash" "hash" "$(rc TYPE user:42)"
assert_eq "user:42 has exactly 3 fields" "3" "$(rc HLEN user:42)"
assert_eq "user:42 name = Ada" "Ada" "$(rc HGET user:42 name)"
assert_eq "user:42 email = ada@example.com" "ada@example.com" "$(rc HGET user:42 email)"
assert_eq "user:42 plan = pro" "pro" "$(rc HGET user:42 plan)"

assert_eq "jobs is a list" "list" "$(rc TYPE jobs)"
assert_eq "jobs holds email, report, cleanup (resize was popped off the head)" \
  "email report cleanup" "$(rc LRANGE jobs 0 -1 | tr '\n' ' ' | sed 's/ $//')"
finish
