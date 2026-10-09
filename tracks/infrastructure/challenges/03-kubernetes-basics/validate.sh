#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/infrastructure/docker.sh"

run_checks node "$(dirname "${BASH_SOURCE[0]}")/check.mjs"

# No Docker (e.g. a locked-down laptop)? ONBOARD_K8S_STATIC=1 checks only the
# manifests. The full validation needs the kind cluster.
if [ -n "${ONBOARD_K8S_STATIC:-}" ]; then
  printf '  %s(ONBOARD_K8S_STATIC is set: skipped the live cluster checks)%s\n' "$YELLOW" "$RESET"
  finish
fi

if require_docker_daemon; then
  assert_true "the kind cluster is running (./cluster.sh up)" cluster_up
  if cluster_up; then
    ready="$(kc get deployment echo -o jsonpath='{.status.readyReplicas}' 2>/dev/null)"
    assert_eq "deployment/echo is applied and 2 pods are Ready" "2" "${ready:-0}"
    eps="$(kc get endpointslices -l kubernetes.io/service-name=echo \
           -o jsonpath='{.items[*].endpoints[*].addresses[*]}' 2>/dev/null | wc -w | tr -d ' ')"
    assert_eq "service/echo is applied and has 2 pod endpoints behind it" "2" "$eps"
    assert_true "the cluster matches your files (kubectl diff -f k8s/ shows nothing)" \
      kc diff -f "$SANDBOX_DIR/k8s/"

    port=$((20000 + RANDOM % 10000))
    kc port-forward svc/echo "$port:80" >/dev/null 2>&1 &
    pf=$!
    wait_for_http "http://127.0.0.1:$port/" 10
    assert_contains "port-forward to svc/echo answers \"hello from kubernetes\"" \
      "$(curl -fsS "http://127.0.0.1:$port/" 2>/dev/null)" "hello from kubernetes"
    kill "$pf" 2>/dev/null; wait "$pf" 2>/dev/null
  fi
fi
finish
