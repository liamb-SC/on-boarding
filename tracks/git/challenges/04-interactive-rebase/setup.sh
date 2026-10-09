#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

# A messy history: real work buried among "wip"/"typo" noise commits.
sb_commit "login.js"      "form"        "Add login form"
sb_commit "login.js"      "form v2"     "wip"
sb_commit "login.js"      "form v3"     "fix typo"
sb_commit "validation.js" "validate"    "Add validation"
sb_commit "validation.js" "validate v2" "wip more validation"
