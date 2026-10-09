#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/aws/fixtures/aws.sh"
aws_need_runtime

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
aws_scaffold @aws-sdk/client-iam @aws-sdk/client-secrets-manager @aws-sdk/client-ssm
cp -R "$HERE/starter/." "$SANDBOX_DIR/"

npm_install_sandbox
aws_start
aws_cleanup '{"roles":["orders-config-reader"],"secrets":["orders/db"],"parameters":["/orders/page-size","/orders/api-key"]}'
sb_commit_all "Orders config starter"
