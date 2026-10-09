#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

# Shared baseline with a value two branches will both edit.
sb_commit "config.yaml" "timeout: 10" "Add service config"

# feature sets timeout to 30
sbg checkout -q -b feature
sb_commit "config.yaml" "timeout: 30" "Increase timeout to 30"

# main sets the same line to 20 -> conflict on merge
sbg checkout -q main
sb_commit "config.yaml" "timeout: 20" "Set timeout to 20"
