#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

sandbox_reset
FIX="$REPO_ROOT/tracks/ways-of-working/fixtures"
mkdir -p "$SANDBOX_DIR/brief"
cp "$FIX/project-brief.md" "$FIX/kickoff-2026-10-06.md" "$SANDBOX_DIR/brief/"

put docs/decisions/README.md <<'MD'
# Decision log

One row per architecture decision record (ADR). Newest at the bottom. Never
delete a row: if a decision changes, write a new ADR and mark the old one
`Superseded by NNNN`.

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-10-05 |
MD

put docs/decisions/0001-record-architecture-decisions.md <<'MD'
# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-05
- **Deciders:** Tom Okafor

## Context
Beacon will make several decisions that are expensive to reverse. People join
and leave, and "why did we do it this way?" gets asked months later.

## Options considered
1. **Decide in meetings and rely on memory.** Free, but the reasoning is lost.
2. **Wiki pages.** Easy to write, but they drift away from the code.
3. **ADRs in the repo**, one short markdown file per decision.

## Decision
We will keep ADRs in `docs/decisions/`, numbered `NNNN-kebab-title.md`, using
the format of this file, and list each one in `README.md`.

## Consequences
- Decisions are reviewed in pull requests like code.
- Each ADR is a small extra piece of writing.
- ADRs are immutable once accepted. A change of mind means a new ADR.
MD

put docs/decisions/template.md <<'MD'
# NNNN. <Short title of the decision>

- **Status:** Proposed | Accepted | Superseded by NNNN
- **Date:** YYYY-MM-DD
- **Deciders:** <names>

## Context
<The forces at play: the problem, the constraints, the facts that matter.>

## Options considered
1. **<Option>.** <Pros and cons.>

## Decision
<What we chose, and why.>

## Consequences
- <What gets easier, what gets harder, and what we now have to do.>
MD
sb_commit_all "Project Beacon brief, kick-off notes and decision log"
