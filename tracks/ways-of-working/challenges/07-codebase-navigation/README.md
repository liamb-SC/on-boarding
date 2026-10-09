# 07 · Finding your way around unfamiliar code

**Skills:** `grep -rn`, `git log` (`--author`, `--grep`, `-S`), `git blame`,
`git show`, `git shortlog`, answering questions from evidence.

## Background
On a new team you'll spend more time *reading* code than writing it. A few
commands answer most "where is...", "who..." and "why..." questions:

| Question | Command |
|----------|---------|
| Where is X defined or used? | `grep -rn "X" src/` (or `git grep -n X`) |
| Who last touched this line, and in which commit? | `git blame -L 10,12 src/file.js` |
| Which commits added or removed the string X? | `git log -S "X" --oneline` |
| Which commits mention X in the message? | `git log --grep "X" --oneline` |
| What changed in a commit, and why? | `git show <sha>` |
| Who works on this repo? | `git shortlog -sn` |

The **why** is usually in the commit message body, not the code. That's
one reason good commit messages matter.

## Scenario
You've been asked to review a `beacon-worker` change next week. Get your
bearings first. The repo is in `beacon-worker/`. The questions are in
`questions.md`.

## Goal
Answer all 8 questions in `answers.json` (strings, e.g. `"BEA-99"`). Each one
is checked separately, so you can validate as you go.

## Hints
- `cd beacon-worker` first. All the git commands run from inside the repo.
- `grep -rn` searches everything, including the `legacy/` folder. Read what
  you find before you answer.
- `git log --format='%h %an %s'` gives a compact history with authors.

## Check your work
```
./onboard validate ways-of-working/07
```
