#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

sb_commit "a.txt" "setup" "Initial project setup"
sb_commit "b.txt" "scaffold" "Add feature scaffolding"

# The valuable commit that is about to be "lost".
sb_commit "important.txt" "critical customer data" "Add critical customer data"

# Simulate the accident: a hard reset drops the last commit. It's gone from the
# branch and the working tree — but git never truly deletes it.
sbg reset --hard HEAD~1 -q
