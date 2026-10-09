#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/aws/fixtures/aws.sh"
aws_need_runtime

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
aws_scaffold @aws-sdk/client-cloudwatch @aws-sdk/client-cloudwatch-logs
cp -R "$HERE/starter/." "$SANDBOX_DIR/"

npm_install_sandbox
aws_start
aws_cleanup '{"logGroups":["/onboard/checkout"],"alarms":["checkout-errors"]}'
# Metric data can't be deleted, so the validator only counts data points sent
# after this moment.
sb_stash_note started_at "$(node -e 'process.stdout.write(String(Date.now()))')"
sb_commit_all "Checkout observability starter"
