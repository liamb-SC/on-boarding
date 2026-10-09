#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"

# A bare "origin" this repo pushes releases to.
ORIGIN="${SANDBOX_DIR}-origin.git"
rm -rf "$ORIGIN"
git init --bare -q -b main "$ORIGIN"

sandbox_reset
sbg remote add origin "$ORIGIN"

# --- 1.0.0: already released and tagged properly ---------------------------
sb_write VERSION   "1.0.0"
sb_write app.sh    'echo "Welcome to the app"'
sb_write CHANGELOG.md "## 1.0.0
- First release"
sb_commit_all "Initial app"
sbg tag -a v1.0.0 -m "Release 1.0.0"
sb_stash_note v100_sha "$(sbg rev-parse HEAD)"

# --- 1.1.0 work: a feature (with a bug nobody has noticed yet) --------------
sb_commit export.sh 'echo "Exporting report to CVS"' "Add report export"
# Someone got over-excited and pushed a lightweight tag on the wrong commit.
sbg tag v1.1

# The actual release commit: version bump + changelog.
sb_write VERSION "1.1.0"
sb_write CHANGELOG.md "## 1.1.0
- Add report export

## 1.0.0
- First release"
sb_commit_all "Release 1.1.0"
sb_stash_note release_sha "$(sbg rev-parse HEAD)"

# --- Unreleased work lands on main after the release commit ----------------
sb_commit theme.sh 'echo "dark mode (experimental)"' "WIP: dark mode toggle"
sb_stash_note wip_sha "$(sbg rev-parse HEAD)"

sbg push -q -u origin main
sbg push -q origin v1.0.0 v1.1
