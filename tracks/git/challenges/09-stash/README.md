# 09 · Set work aside with stash

**Skills:** `git stash`, `git stash pop`

## Scenario
You're mid-way through changing `app.txt` (now `v2 WIP`) but it's not ready to
commit. Suddenly an urgent hotfix needs to go in on a clean tree.

## Goal
1. **Stash** your uncommitted WIP so the working tree is clean.
2. Add a hotfix: create `hotfix.txt` and commit it (message "Hotfix"). You now
   have 2 commits, and the committed `app.txt` is still `v1`.
3. **Pop** your stash so `app.txt` shows `v2 WIP` again — with an empty stash
   list.

## Hints
- `git stash` (or `git stash push`) saves and reverts your changes.
- `git status` should be clean afterwards — then do the hotfix commit.
- `git stash pop` re-applies your WIP; `git stash list` should end up empty.

## Check your work
```
./onboard validate git/09
```
