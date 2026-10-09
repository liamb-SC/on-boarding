# 03 · Context files and task prompts

**Skills:** writing a project context file (`CLAUDE.md`), writing a task
prompt with evidence, a verification step and constraints.

## Background
An AI coding agent is only as good as the context it gets. Two things
matter most:

- **A project context file.** Claude Code loads `CLAUDE.md` from the project
  root into every session, and other tools have their own equivalent. Put
  the things a new teammate would need on day one and can't guess: the exact
  build/test/lint commands, conventions, and "don't touch" areas. Keep it
  **short**, because it uses up context in every session. Keep **secrets** out.
- **A good task prompt.** "It's broken, fix it" forces the agent to guess. A
  good prompt gives:
  1. **Where**: the file, function or failing test.
  2. **Evidence**: the error, or expected vs actual output.
  3. **Done means**: how to verify, e.g. "`npm test` passes".
  4. **Constraints**: what not to change.

## Scenario
`basket-service` has a failing test. A colleague's prompt is in
`prompts/fix-rounding.md`: *"the totals are wrong, can you fix it"*.

## Goal
1. Explore the repo (`package.json`, `src/`, `scripts/`, `npm test`), then
   write a `CLAUDE.md` of at most 60 lines. Include:
   the test, lint and codegen commands, the rule about `src/generated/`, the
   money convention and the discount rounding rule.
2. Rewrite `prompts/fix-rounding.md` into a prompt a teammate or an agent
   could act on without asking a question. Include where, the evidence
   (expected vs actual), how to verify and what not to change.
3. Fix the bug: give your prompt to Claude Code (`claude` in this folder)
   or do it by hand. `npm test` must pass, without changing the test or the
   generated file.

## Hints
- `npm test` prints the failing test's name and the expected and actual values.
- Read the comments in `src/`. Conventions often live there.
- After step 3, ask yourself whether the agent got it right first time. If
  not, what was missing from the prompt?

## Check your work
```
./onboard validate ai-tooling/03
```
