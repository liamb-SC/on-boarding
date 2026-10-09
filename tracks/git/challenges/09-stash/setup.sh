#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

sb_commit "app.txt" "v1" "Initial app"

# Uncommitted work-in-progress the learner is not ready to commit.
sb_write "app.txt" "v2 WIP"
