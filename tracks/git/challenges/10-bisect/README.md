# 10 · Find the regression with bisect

**Skills:** `git bisect`, `git bisect run`

## Scenario
`calc.sh` used to print `42`. Somewhere in the last 8 commits a "refactor" broke
it — now it prints `99`. The current tip (`c8`) is **bad**; the first commit
(`c1`) is **good**. You need the exact commit that introduced the bug.

A ready-made test harness is in your sandbox: `test.sh` exits 0 when `calc.sh`
prints 42, non-zero otherwise.

## Goal
Use `git bisect` to identify the **first bad commit**, then write its full SHA
into a file called `bisect_answer.txt` at the root of your sandbox.

## Hints
```
git bisect start
git bisect bad HEAD          # current tip is broken
git bisect good <c1-sha>     # the first commit was fine  (git log --oneline)
git bisect run ./test.sh     # let git find it automatically
```
- Git prints "<sha> is the first bad commit". Record it:
  `git rev-parse <sha> > bisect_answer.txt`
- Tidy up with `git bisect reset` when done.

## Check your work
```
./onboard validate git/10
```
