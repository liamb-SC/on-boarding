# 05 · Rebase onto the latest main

**Skills:** `git rebase`, keeping a linear history

## Scenario
You branched `feature` off `main`, then `main` moved on with an important commit
(`C: important main update`). Your `feature` branch is now based on a stale
`main`.

```
A --- B --- C   (main)
       \
        F       (feature, you are here)
```

## Goal
Replay your `feature` work on top of the current `main` so the history becomes
linear and `feature` includes commit `C`:

```
A --- B --- C            (main)
             \
              F'         (feature)
```

## Hints
- From `feature`: `git rebase main`.
- Afterwards `git log --oneline --graph --all` should show a straight line.
- `git rebase --abort` if it goes sideways.

## Check your work
```
./onboard validate git/05
```
