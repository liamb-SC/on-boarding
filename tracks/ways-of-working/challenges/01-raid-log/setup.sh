#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

sandbox_reset
FIX="$REPO_ROOT/tracks/ways-of-working/fixtures"
mkdir -p "$SANDBOX_DIR/brief"
cp "$FIX/project-brief.md" "$FIX/kickoff-2026-10-06.md" "$SANDBOX_DIR/brief/"

put raid-log.md <<'MD'
# Project Beacon: RAID log

Last updated: YYYY-MM-DD

| ID | Type | Description | Owner | Impact | Mitigation / next step | Status |
|----|------|-------------|-------|--------|------------------------|--------|
| TODO | | | | | | |
MD
sb_commit_all "Project Beacon brief, kick-off notes and an empty RAID log"
