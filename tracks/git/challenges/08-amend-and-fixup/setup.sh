#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

# A single commit that shipped with a typo in the code.
sb_commit "user.py" "class Usr:" "Add user model"
