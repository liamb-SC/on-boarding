# 07 · Cherry-pick a single commit

**Skills:** `git cherry-pick`, `git log`

## Scenario
The `hotfix` branch has one important commit — "Fix critical security vuln"
(adds `patch.txt`). You want **just that fix** on `main`, without merging the
rest of the branch.

## Goal
Bring the hotfix commit onto `main` so `patch.txt` appears there, while keeping
`main`'s own work (`main.txt`) and **without** merging the whole `hotfix`
branch.

## Hints
- `git log hotfix --oneline` shows the commit; copy its SHA.
- On `main`: `git cherry-pick <sha>`.

## Check your work
```
./onboard validate git/07
```
