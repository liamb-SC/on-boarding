# 06 · Write an RFC

**Skills:** RFCs (Request for Comments): problem before solution, a concrete
proposal, alternatives, open questions, asking for review.

## Background
An **RFC** is how you propose a change that affects other people *before*
building it. You write it, share it, collect comments, and then it's accepted
or rejected. A good RFC:

- **Problem**: what's wrong, for whom, and the *evidence*. No solution yet.
  If readers don't agree on the problem, they won't agree on the fix.
- **Proposal**: specific enough that someone could build it from the text.
- **Alternatives considered**: the other options and why you didn't choose
  them. "Do nothing" is often a fair one.
- **Open questions**: what you *don't* know. This invites useful comments
  instead of nitpicks.

It also needs a status, named reviewers and a deadline for comments, or it
sits unread forever.

## Scenario
Read "Other" in `brief/status-notes-2026-10-23.md`. Customers are being
texted late at night and nobody owns the fix. You decide to propose
**quiet hours** for delivery texts in `beacon-worker`.

## Goal
Fill in `rfcs/0001-quiet-hours.md`:
1. Title, your name as author, created date, a **status** that fits an RFC
   that's just been written, at least two **reviewers** from the team, and a
   **comments-by** date.
2. **Problem**, with the evidence from the notes.
3. **Proposal**, with the exact quiet-hours window (as `HH:MM` times) and
   what happens to a text that's due during quiet hours.
4. At least two **Alternatives considered**, each with why not.
5. At least two **Open questions**, as real questions.

## Hints
- Think about "out for delivery": if you hold it until morning, is it still
  useful? That's a good open question, or a reason to refine the proposal.
- Keep it short. One screen is a fine RFC.

## Check your work
```
./onboard validate ways-of-working/06
```
