# 02 · Branch and merge

**Skills:** `git branch`, `git checkout`/`switch`, `git merge`

## Scenario
There are two branches:
- `main` — has `base.txt` and `main.txt`
- `feature` — branched off the baseline and added `feature.txt`

Both branches moved on independently, so this is a genuine merge (not a
fast-forward).

## Goal
From `main`, merge `feature` so that `main` contains **both** `feature.txt` and
`main.txt`, with a clean working tree.

## Hints
- `git log --oneline --all --graph` shows how the branches diverged.
- Make sure you're on `main` first, then `git merge feature`.

## Check your work
```
./onboard validate git/02
```
