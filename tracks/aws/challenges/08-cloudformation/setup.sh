#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/aws/fixtures/aws.sh"
aws_need_runtime

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
aws_scaffold @aws-sdk/client-cloudformation @aws-sdk/client-s3 @aws-sdk/client-sqs @aws-sdk/client-ssm
cp -R "$HERE/starter/." "$SANDBOX_DIR/"

npm_install_sandbox
aws_start
aws_cleanup '{"stacks":["onboard-app"]}'
sb_commit_all "onboard-app CloudFormation starter"
