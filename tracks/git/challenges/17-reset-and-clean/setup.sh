#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

sb_commit "app.js"    "console.log('v1');" "Add app"
sb_commit "README.md" "# Project"          "Add readme"

# Make a mess to clean up:
# 1. a tracked file broken AND staged
sb_write "app.js" "console.log('BROKEN experiment');"
sbg add app.js
# 2. another tracked file edited but not staged
sb_write "README.md" "# Project (accidental edit)"
# 3. untracked junk (a file and a whole directory)
sb_write "debug.log"        "noise noise noise"
sb_write "build/output.tmp" "throwaway artifact"
