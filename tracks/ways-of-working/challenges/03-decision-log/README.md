# 03 · Decision log (ADRs)

**Skills:** architecture decision records (context, options, decision,
consequences), statuses, keeping a decision log.

## Background
Decisions made in meetings get forgotten. Six months later someone asks "why
on earth did we...?" and nobody remembers. An **ADR** (Architecture Decision
Record) is a short markdown file that captures one decision:

- **Context**: the forces at play. Constraints, facts, numbers.
- **Options considered**: what else you could have done, with pros and cons.
- **Decision**: what you chose *and why*.
- **Consequences**: what changes as a result, good **and** bad, and what you
  now have to do.

ADRs are numbered, kept next to the code, and **immutable** once accepted. To
change your mind you write a new ADR that supersedes the old one. A **decision
log** is the index of them all.

## Scenario
At the Beacon kick-off (`brief/kickoff-2026-10-06.md`), the team decided how
`beacon-worker` should call TextBridge. Tom has an action to write it up.
Do it for him.

## Goal
1. Copy `docs/decisions/template.md` to
   `docs/decisions/0002-<kebab-title>.md` and fill it in from the transcript:
   status, date, deciders, context (with the real numbers), all three options,
   the decision and its reasons, and at least 3 consequences, including the
   downsides Tom mentioned.
2. Add a row for it to the decision log in `docs/decisions/README.md`,
   linked to the file.

`0001-record-architecture-decisions.md` is a finished example.

## Hints
- The status is `Accepted` because the decision was agreed in the meeting.
  The date is the day of the decision, not today.
- A good Consequences section has at least one bullet that makes you wince
  a little.

## Check your work
```
./onboard validate ways-of-working/03
```
