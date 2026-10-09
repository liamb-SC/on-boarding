#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

sb_commit "app.js"      "app"        "Add app"
sb_commit "feature.js"  "feature"    "Add feature"
sb_commit "backdoor.js" "evil()"     "Add debug backdoor"   # <- the bad commit, in the middle
sb_commit "polish.js"   "polish"     "Polish UI"            # <- good work done AFTER it

# Remember which commit is the bad one (the README hands it to you).
sb_stash_note bad_sha "$(sbg rev-parse HEAD~1)"
