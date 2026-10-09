#!/usr/bin/env bash
# setup.sh — build the challenge's starting state in the learner's sandbox.
# The runner exports REPO_ROOT and SANDBOX_DIR before calling this.
source "$REPO_ROOT/lib/sandbox.sh"

# For git challenges, start from a clean repo:
sandbox_reset

# Helpers available (all act on $SANDBOX_DIR):
#   sbg <git args...>              run git in the sandbox
#   sb_write   <path> <content>    write an uncommitted file
#   sb_commit  <path> <content> <msg>   write+stage+commit one file
#   sb_commit_all <msg>           stage everything and commit
#   sb_stash_note <key> <value>   stash a value for the validator (hidden in .git)
#
# Non-git tracks can ignore sandbox_reset and just create files/state instead.

sb_commit "example.txt" "starting content" "Initial state"
