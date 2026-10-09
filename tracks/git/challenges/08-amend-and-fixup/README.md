# 08 · Fix the last commit with amend

**Skills:** `git commit --amend`

## Scenario
Your one and only commit, "Add user model", shipped with a typo: `user.py`
declares `class Usr:` instead of `class User:`. Nothing else has been committed
on top, so you can fix it in place.

## Goal
Correct `user.py` to `class User:` and fold the fix into the existing commit —
**still exactly one commit**, no new commit added — with a clean working tree.

## Hints
- Edit `user.py`, then `git add user.py`.
- `git commit --amend` rewrites the last commit (keep or edit the message).
- `git log --oneline` should still show a single commit.

## Check your work
```
./onboard validate git/08
```
 