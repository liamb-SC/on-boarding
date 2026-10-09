#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

# main: base commit
sb_commit "base.txt" "shared baseline" "Add project baseline"

# feature branch adds a file
sbg checkout -q -b feature
sb_commit "feature.txt" "the new feature" "Add feature"

# main advances too, so a real (non fast-forward) merge is required
sbg checkout -q main
sb_commit "main.txt" "work on main" "Continue work on main"
