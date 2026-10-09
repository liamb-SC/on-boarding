# 20 · Rename branches

**Skills:** `git branch -m`, `git branch` listing

## Scenario
Two branches need better names:
- `feautre-login` — a typo (should be `feature-login`). You're **not** on it.
- `temp-wip` — a throwaway name for real work (should be `develop`). You **are**
  on it right now.

## Goal
- Rename `feautre-login` → `feature-login` (keeping its commit).
- Rename your current branch `temp-wip` → `develop` (and stay on it).

Afterwards the old names must be gone.

## Steps
```bash
git branch                          # list local branches (current is marked *)

# Rename another branch (old -> new):
git branch -m feautre-login feature-login

# Rename the branch you're ON (just give the new name):
git branch -m develop
```
- `-m` = move/rename. Use `-M` to force over an existing name (careful).
- Renaming is local only — if the branch was pushed, you'd also
  `git push origin :old new` and reset upstreams. Not needed here.

## Check your work
```
./onboard validate git/20
```
