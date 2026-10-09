#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset
# Leave an uncommitted file for the learner to stage and commit.
sb_write "hello.txt" "Hello, StepChange!"
