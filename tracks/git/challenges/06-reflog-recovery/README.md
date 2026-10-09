# 06 · Recover a lost commit with reflog

**Skills:** `git reflog`, `git reset` / `git cherry-pick`

## Scenario
Disaster: someone ran `git reset --hard` and a commit that added
`important.txt` (critical customer data) vanished from the branch and the
working tree. It looks gone.

It isn't. Git keeps a log of everywhere `HEAD` has been.

## Goal
Recover the lost commit so `important.txt` is back in your history with its
original contents, and the working tree is clean.

## Hints
- `git reflog` lists recent `HEAD` positions — find the entry for
  "Add critical customer data".
- Restore it with either:
  - `git reset --hard <sha>` (move the branch back to it), or
  - `git cherry-pick <sha>` (re-apply just that commit).
- `git show <sha>` lets you confirm you found the right one first.

## Check your work
```
./onboard validate git/06
```
