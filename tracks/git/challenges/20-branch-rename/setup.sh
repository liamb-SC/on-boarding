#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

sb_commit "app.js" "app" "Add app"          # on main

# A branch with a typo in its name (you are NOT on it).
sbg checkout -q -b feautre-login
sb_commit "login.js" "login" "Add login form"

# A throwaway-named branch that you ARE on and want to rename.
sbg checkout -q main
sbg checkout -q -b temp-wip
sb_commit "wip.js" "wip" "WIP work"
# left on temp-wip
