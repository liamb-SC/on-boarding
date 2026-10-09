#!/usr/bin/env bash
# tracks/aws/fixtures/aws.sh — helpers for the AWS track's setup.sh and
# validate.sh. Source after lib/sandbox.sh + lib/node.sh (setup) or
# lib/common.sh + lib/node.sh (validate).
#
# Every LocalStack challenge follows the same shape:
#   setup:    aws_need_runtime; sandbox_reset; aws_scaffold <sdk clients...>;
#             copy the starter; npm_install_sandbox; aws_start; aws_cleanup '<json>'
#   validate: require_localstack; run_checks node check.mjs; finish

AWS_FIXTURES="$REPO_ROOT/tracks/aws/fixtures"
AWS_ENDPOINT="${AWS_ENDPOINT_URL:-http://localhost:4566}"

localstack_healthy() { bash "$AWS_FIXTURES/sandbox/localstack.sh" health >/dev/null 2>&1; }

# aws_need_runtime — fail fast (before any npm install) unless LocalStack is
# already answering or Docker is there to start it.
aws_need_runtime() {
  need node "Install Node.js 20+ (https://nodejs.org or nvm)."
  need npm
  localstack_healthy && return 0
  need docker "This challenge runs AWS locally in LocalStack, which needs Docker: https://docs.docker.com/get-docker/"
  if ! docker info >/dev/null 2>&1; then
    printf '✗ Docker is installed but its daemon isn'"'"'t reachable (is Docker Desktop running?).\n' >&2
    printf '  Start Docker, then run this again.\n' >&2
    exit 1
  fi
}

# aws_scaffold <npm packages...> — the files every AWS sandbox shares:
# aws.mjs (SDK config for LocalStack), localstack.sh, package.json, .gitignore.
# The SDK is pinned to one release: all @aws-sdk packages version in lockstep,
# and later releases (2027+) drop Node 20.
aws_scaffold() {
  cp "$AWS_FIXTURES/sandbox/aws.mjs" "$AWS_FIXTURES/sandbox/localstack.sh" "$SANDBOX_DIR/"
  chmod +x "$SANDBOX_DIR/localstack.sh"
  printf 'node_modules/\n' | put .gitignore
  node -e '
    const [name, ...deps] = process.argv.slice(1);
    const pkg = { name, version: "1.0.0", private: true, type: "module", dependencies: {} };
    for (const d of deps.sort()) pkg.dependencies[d] = "3.1148.0";
    process.stdout.write(JSON.stringify(pkg, null, 2) + "\n");
  ' "onboard-aws-$(basename "$SANDBOX_DIR")" "$@" | put package.json
}

# aws_start — start (or reuse) LocalStack and wait for it to be healthy
aws_start() {
  bash "$SANDBOX_DIR/localstack.sh" start || exit 1
}

# aws_cleanup '<json>' — delete what an earlier attempt at this challenge left
# in LocalStack, so a reset really starts from scratch. See cleanup.mjs.
aws_cleanup() {
  SANDBOX_DIR="$SANDBOX_DIR" node "$AWS_FIXTURES/cleanup.mjs" "$1" || {
    printf '✗ Could not clear leftovers from an earlier attempt (see above).\n' >&2
    printf '  For a completely clean LocalStack: ./localstack.sh restart (wipes all challenges), then reset again.\n' >&2
    exit 1
  }
}

# require_localstack — validators call this first: one clear failure instead
# of a page of connection errors when LocalStack isn't up.
require_localstack() {
  localstack_healthy && return 0
  _checks_total=$((_checks_total + 1)); _checks_failed=$((_checks_failed + 1))
  _bad "LocalStack is running at $AWS_ENDPOINT" "start Docker, then run ./localstack.sh start in your sandbox"
  finish
}
