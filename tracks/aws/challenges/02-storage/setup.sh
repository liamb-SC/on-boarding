#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
source "$REPO_ROOT/tracks/aws/fixtures/aws.sh"
aws_need_runtime

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sandbox_reset
aws_scaffold @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/client-ec2
cp -R "$HERE/starter/." "$SANDBOX_DIR/"
printf 'presigned-url.txt\n' >> "$SANDBOX_DIR/.gitignore"

npm_install_sandbox
aws_start
aws_cleanup '{"buckets":["onboard-receipts"],"volumeTags":["onboard-data"]}'
sb_commit_all "Receipts storage starter"
