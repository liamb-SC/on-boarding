#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

sandbox_reset
FIX="$REPO_ROOT/tracks/ways-of-working/fixtures"
mkdir -p "$SANDBOX_DIR/brief"
cp "$FIX/project-brief.md" "$FIX/status-notes-2026-10-23.md" "$SANDBOX_DIR/brief/"

put status-report.md <<'MD'
# Project Beacon: status report

**Reporting period:** week ending YYYY-MM-DD
**Author:** <your name>

## Summary
<Two or three sentences a busy sponsor can read in 20 seconds.>

## RAG status
| Area | RAG | Commentary |
|------|-----|------------|
| Overall | | |
| Schedule | | |
| Scope | | |
| Budget | | |

## Key risks and issues
- <...>

## Decisions needed
- <...>

## Next steps
- <...>
MD
sb_commit_all "Project Beacon brief, week-3 notes and a status report template"
