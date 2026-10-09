#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

# Commit as different authors so `git log --author=` has something to find.
commit_as() { # name email path content message
  sb_write "$3" "$4"
  sbg add "$3"
  sbg commit -q --author="$1 <$2>" -m "$5"
}
A='Alice'; ae='alice@onboarding.local'
B='Bob';   be='bob@onboarding.local'
C='Carol'; ce='carol@onboarding.local'

commit_as "$A" "$ae" src/app.js   "function app(){}"            "Add app skeleton"
commit_as "$B" "$be" README.md    "# Project"                   "Add readme"
commit_as "$A" "$ae" src/app.js   "function app(){ return 1; }" "Implement app()"
commit_as "$C" "$ce" config.js    "const SECRET_KEY='xyz';"     "Add config with SECRET_KEY"
commit_as "$B" "$be" src/app.js   "function app(){ return 2; }" "Fix app() return value"
commit_as "$A" "$ae" README.md    "# Project\n\nUsage docs"     "Expand readme"

# Leave a template answers file for the learner to fill in.
cat > "$SANDBOX_DIR/answers.txt" <<'EOF'
# Fill in the values, then run: ./onboard validate git/14
# Use git log techniques — do NOT count by hand.
alice_commits=
app_changes=
secret_commit=
EOF
