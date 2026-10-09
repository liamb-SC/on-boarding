# 01 · RAID log

**Skills:** Risks vs Issues vs Assumptions vs Dependencies, owners, impact,
mitigations, keeping a RAID log useful.

## Background
A **RAID log** is the one place a project keeps the things that could knock it
off course:

| Type | It is... | Example |
|------|----------|---------|
| **Risk** | something that *might* happen and would hurt | "We might miss the launch date" |
| **Assumption** | something we're treating as true *without proof* | "Users have modern browsers" |
| **Issue** | something that *is* happening now and hurts | "The build server is down" |
| **Dependency** | something we need from someone *outside the team* | "Legal must approve the T&Cs" |

Every row needs **one named owner**. A team can't own anything. Each row
also needs a next step. A risk that comes true becomes an issue. An assumption
that turns out to be false often becomes one too.

## Scenario
You've joined **Project Beacon** at Brightwell Home. Read `brief/project-brief.md`
and the kick-off transcript `brief/kickoff-2026-10-06.md`, then fill in
`raid-log.md`.

## Goal
Replace the `TODO` row in `raid-log.md` with **at least 6 entries** covering
everything the brief and the meeting surface:
- Use all four types. IDs start with the type's letter: `R1`, `A1`, `I1`, `D1`...
- **Owner**: one person from the Beacon team (e.g. `Aisha Khan` or `Aisha`).
- **Impact**: `High`, `Medium` or `Low`. **Status**: `Open` or `Closed`.
- A real description and a mitigation / next step for every row.
- Fill in the **Last updated** date (`YYYY-MM-DD`).

The validator checks the structure *and* that the important items from the
meeting are logged as the right type.

## Hints
- Read the transcript for phrases like *"we're assuming"*, *"if X slips"*,
  *"that's happening now"* and *"we can't do Y until they..."*.
- Keep the table a plain markdown table: one row per line, `|` between cells.

## Check your work
```
./onboard validate ways-of-working/01
```
