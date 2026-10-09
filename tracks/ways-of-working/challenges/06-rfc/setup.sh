#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

sandbox_reset
FIX="$REPO_ROOT/tracks/ways-of-working/fixtures"
mkdir -p "$SANDBOX_DIR/brief"
cp "$FIX/project-brief.md" "$FIX/kickoff-2026-10-06.md" "$FIX/status-notes-2026-10-23.md" "$SANDBOX_DIR/brief/"

put rfcs/0001-quiet-hours.md <<'MD'
# RFC 0001: <title>

- **Author:** <your name>
- **Status:** <Draft | In review | Accepted | Rejected>
- **Created:** YYYY-MM-DD
- **Reviewers:** <names>
- **Comments by:** YYYY-MM-DD

## Problem
<What's wrong, for whom, and how we know. Evidence, not opinions. No solutions yet.>

## Proposal
<What you want to do, concretely enough that someone could build it.>

## Alternatives considered
- <Another way to solve it, and why you didn't pick it.>

## Open questions
- <What you don't know yet and want reviewers to weigh in on?>
MD
sb_commit_all "Project Beacon brief, notes and an RFC template"
