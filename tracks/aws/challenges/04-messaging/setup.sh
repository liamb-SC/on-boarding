#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/aws/fixtures/aws.sh"
aws_need_runtime

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
aws_scaffold @aws-sdk/client-sqs @aws-sdk/client-sns @aws-sdk/client-eventbridge
cp -R "$HERE/starter/." "$SANDBOX_DIR/"

npm_install_sandbox
aws_start
aws_cleanup '{"rules":["big-orders"],"topics":["orders"],"queues":["orders-email","orders-analytics","big-orders"]}'
sb_commit_all "Order messaging starter"
