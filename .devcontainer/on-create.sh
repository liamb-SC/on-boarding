#!/usr/bin/env bash
# .devcontainer/on-create.sh — warm every download the challenges would
# otherwise make on first use. Runs once when the container is created (during
# the prebuild, when prebuilds are on). Nothing here is required: a step that
# fails just means that download happens later, inside the challenge.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

step() { printf '\n▶ %s\n' "$*"; }
warn() { printf '! %s (the challenge will retry this itself)\n' "$*" >&2; }

# Block accidental pushes to main (see .githooks/pre-push).
git config core.hooksPath .githooks

# kind + kubectl, using the repo's own pinned versions and cache directory.
step "kind and kubectl"
# shellcheck source=../tracks/infrastructure/docker.sh
source tracks/infrastructure/docker.sh
ensure_kind_and_kubectl || warn "couldn't download kind/kubectl"

step "pnpm and yarn"
pnpm --version && yarn --version || warn "corepack couldn't fetch pnpm/yarn"

step "Playwright Chromium"
npx -y playwright@latest install chromium || warn "couldn't install Chromium"

step "Waiting for the Docker daemon"
for _ in $(seq 60); do docker info >/dev/null 2>&1 && break; sleep 1; done
if ! docker info >/dev/null 2>&1; then
  warn "Docker daemon didn't start, skipping image pulls"
  exit 0
fi

# Read image tags from the scripts that use them, so bumping a version there
# is enough.
localstack_image="$(sed -n 's/^IMAGE="\${LOCALSTACK_IMAGE:-\(.*\)}"$/\1/p' tracks/aws/fixtures/sandbox/localstack.sh)"
images=(
  "${localstack_image:-localstack/localstack:4.14}"
  public.ecr.aws/lambda/nodejs:22   # what LocalStack runs nodejs22.x Lambdas in
  redis:7-alpine
  node:20-alpine                    # base image of the infrastructure fixtures
  "$TERRAFORM_IMAGE"
  hashicorp/http-echo:latest
)
for img in "${images[@]}"; do
  step "docker pull $img"
  docker pull -q "$img" || warn "couldn't pull $img"
done

# kind has no "pull the node image" command; creating and deleting a cluster
# leaves the node image behind for infrastructure/03.
step "kind node image"
kind create cluster --name onboard-prewarm --wait 60s >/dev/null 2>&1 || warn "couldn't create a kind cluster"
kind delete cluster --name onboard-prewarm >/dev/null 2>&1

printf '\n✓ Environment ready. Run ./onboard list to get started.\n'
