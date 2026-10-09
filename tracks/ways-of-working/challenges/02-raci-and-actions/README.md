# 02 · RACI matrix and action tracker

**Skills:** RACI (Responsible, Accountable, Consulted, Informed), "exactly one
A", turning meeting talk into tracked actions with an owner and a due date.

## Background
- A **RACI** matrix says who does what on each activity:
  **R**esponsible does the work. **A**ccountable owns the outcome and signs it
  off. **C**onsulted is asked *before*. **I**nformed is told *after*.
  The golden rule: **exactly one A per row**. Two A's means nobody is really
  accountable. There must be at least one R. One person can be `A/R`.
- An **action tracker** stops "I'll look into it" from evaporating. Every
  action has **one owner** (a person, never "the team"), a **due date** and a
  **status**. Write actions so someone else could tell when they're done:
  "Book the pen test slot", not "Security stuff".

## Scenario
The Project Beacon kick-off just happened. Read `brief/kickoff-2026-10-06.md`
and capture who's on the hook for what.

## Goal
1. Fill in every row of `raci.md` (columns are first names). Use what people
   said in the meeting: who said *"I'm accountable"*, who *runs* what, who
   asked to be *consulted* or *informed*.
2. Replace the `TODO` row in `actions.md` with every action agreed in the
   meeting (there are 5). Use `YYYY-MM-DD` due dates (the meeting was on
   2026-10-06, so "Friday" means 2026-10-09) and one status each.

## Hints
- When nobody claims accountability for an activity, it usually sits with
  whoever does it or whoever runs that function.
- Cells can be `A/R`, `R`, `C`, `I` or empty.

## Check your work
```
./onboard validate ways-of-working/02
```
