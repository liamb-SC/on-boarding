#!/usr/bin/env bash
# tracks/infrastructure/docker.sh — Docker helpers shared by this track's
# setup.sh and validate.sh scripts. Source after lib/sandbox.sh or lib/common.sh.

# docker_up — is the Docker daemon reachable (not just the CLI installed)?
docker_up() { command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; }

# docker_hint — say clearly why Docker checks can't run (setup scripts)
docker_hint() {
  docker_up && return 0
  printf '! Docker is installed but its daemon is not reachable, so you can write the files\n' >&2
  printf '  now but not run them yet. Start Docker Desktop (with WSL integration enabled\n' >&2
  printf '  for your distro) or `sudo service docker start`, then check with: docker info\n' >&2
}

# require_docker_daemon — validate.sh: one failing check (instead of a pile of
# confusing ones) when the daemon is down. Returns non-zero so callers can skip
# the Docker checks: `if require_docker_daemon; then ...; fi`.
require_docker_daemon() {
  assert_true "Docker daemon is reachable (start Docker, then check with: docker info)" docker_up
  docker_up
}

# wait_for_http <url> [seconds] — poll until the URL answers 2xx
wait_for_http() {
  local url="$1" secs="${2:-30}" i
  for ((i = 0; i < secs * 2; i++)); do
    curl -fsS -o /dev/null "$url" 2>/dev/null && return 0
    sleep 0.5
  done
  return 1
}

# ----- Kubernetes (kind = Kubernetes in Docker) ----------------------------
# kind and kubectl are downloaded once into a per-user cache, not installed
# system-wide. Bump the versions here.
KIND_VERSION=v0.33.0
KUBECTL_VERSION=v1.34.1
KIND_CLUSTER=onboard
KUBE_CONTEXT="kind-$KIND_CLUSTER"
ONBOARD_BIN="${XDG_CACHE_HOME:-$HOME/.cache}/onboard/bin"
export PATH="$ONBOARD_BIN:$PATH"

_os_arch() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  case "$(uname -m)" in x86_64|amd64) arch=amd64 ;; aarch64|arm64) arch=arm64 ;; *) arch="$(uname -m)" ;; esac
  printf '%s %s' "$os" "$arch"
}

# fetch_tool <name> <url> — download a binary into $ONBOARD_BIN unless it's on PATH
fetch_tool() {
  command -v "$1" >/dev/null 2>&1 && return 0
  mkdir -p "$ONBOARD_BIN"
  printf 'Downloading %s into %s ...\n' "$1" "$ONBOARD_BIN"
  if curl -fsSL -o "$ONBOARD_BIN/$1.tmp" "$2"; then
    chmod +x "$ONBOARD_BIN/$1.tmp" && mv "$ONBOARD_BIN/$1.tmp" "$ONBOARD_BIN/$1"
  else
    rm -f "$ONBOARD_BIN/$1.tmp"
    printf '! Could not download %s from %s\n' "$1" "$2" >&2
    return 1
  fi
}

ensure_kind_and_kubectl() {
  local os arch; read -r os arch <<< "$(_os_arch)"
  fetch_tool kind "https://kind.sigs.k8s.io/dl/$KIND_VERSION/kind-$os-$arch"
  fetch_tool kubectl "https://dl.k8s.io/release/$KUBECTL_VERSION/bin/$os/$arch/kubectl"
}

# kc — kubectl pinned to the onboarding cluster, whatever your current context is
kc() { kubectl --context "$KUBE_CONTEXT" "$@"; }
cluster_up() { docker_up && kc get nodes >/dev/null 2>&1; }

# ----- Terraform, via the official image ----------------------------------
TERRAFORM_IMAGE=hashicorp/terraform:1.16

# put_tf_wrapper — write ./tf into the sandbox: terraform without installing it
put_tf_wrapper() {
  put tf <<SH
#!/usr/bin/env bash
# ./tf <args>  — runs terraform from the $TERRAFORM_IMAGE Docker image, with this
# directory mounted at /work. Use it exactly like the terraform CLI: ./tf init, ./tf plan...
cd "\$(dirname "\$0")" || exit 1
tty=(); [ -t 0 ] && [ -t 1 ] && tty=(-t)
exec docker run --rm -i "\${tty[@]}" \\
  -v "\$PWD:/work" -w /work -u "\$(id -u):\$(id -g)" \\
  -e HOME=/tmp -e CHECKPOINT_DISABLE=1 -e TF_IN_AUTOMATION -e TF_LOG \\
  $TERRAFORM_IMAGE "\$@"
SH
  chmod +x "$SANDBOX_DIR/tf"
}
