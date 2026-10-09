#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

sandbox_reset
FIX="$REPO_ROOT/tracks/ways-of-working/fixtures"
mkdir -p "$SANDBOX_DIR/brief"
cp "$FIX/project-brief.md" "$FIX/kickoff-2026-10-06.md" "$SANDBOX_DIR/brief/"

put raci.md <<'MD'
# Project Beacon: RACI

R = Responsible (does the work) · A = Accountable (owns the outcome, signs it off) ·
C = Consulted (asked before) · I = Informed (told after). Combine letters with a
slash, e.g. `A/R`. Leave a cell empty if the person isn't involved.

| Activity | Priya | Tom | Aisha | Dan | Sofia | Ben |
|----------|-------|-----|-------|-----|-------|-----|
| Go-live sign-off | | | | | | |
| TextBridge integration build | | | | | | |
| Vendor escalation with TextBridge | | | | | | |
| Penetration test | | | | | | |
| Provision secrets and SQS queue | | | | | | |
| Regression testing | | | | | | |
| Phone-number (E.164) data check | | | | | | |
MD

put actions.md <<'MD'
# Project Beacon: action tracker

Status is one of: Not started, In progress, Done, Blocked.

| ID | Action | Owner | Due | Status |
|----|--------|-------|-----|--------|
| TODO | | | | |
MD
sb_commit_all "Project Beacon brief, kick-off notes, empty RACI and action tracker"
