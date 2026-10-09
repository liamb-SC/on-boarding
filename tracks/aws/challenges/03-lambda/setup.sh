#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/aws/fixtures/aws.sh"
aws_need_runtime

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
aws_scaffold @aws-sdk/client-lambda @aws-sdk/client-iam
cp -R "$HERE/starter/." "$SANDBOX_DIR/"

npm_install_sandbox
aws_start
aws_cleanup '{"functions":["order-total"]}'
sb_commit_all "order-total Lambda starter"
