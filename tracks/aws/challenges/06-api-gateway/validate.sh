#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/aws/fixtures/aws.sh"
require_localstack
run_checks node "$(dirname "${BASH_SOURCE[0]}")/check.mjs"
finish
