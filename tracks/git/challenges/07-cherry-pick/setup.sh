#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

sb_commit "app.txt" "app v1" "Initial app"

# hotfix branch contains a single valuable fix commit.
sbg checkout -q -b hotfix
sb_commit "patch.txt" "security patch applied" "Fix critical security vuln"

# main carries on with unrelated work; do NOT merge the whole branch.
sbg checkout -q main
sb_commit "main.txt" "ongoing work" "Ongoing feature work"

# Record the hotfix sha so the README can hint if needed (not required by validator).
sb_stash_note hotfix_sha "$(sbg rev-parse hotfix)"
