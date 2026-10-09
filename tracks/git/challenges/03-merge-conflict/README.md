# 03 · Resolve a merge conflict

**Skills:** conflict resolution, `git merge`, `git add`, `git commit`

## Scenario
Both `main` and `feature` changed the **same line** of `config.yaml`:
- `main` set `timeout: 20`
- `feature` set `timeout: 30`

Merging will conflict.

## Goal
From `main`, merge `feature`, resolve the conflict in `config.yaml` (pick a
value — there's no wrong answer, just remove the conflict markers), and complete
the merge with a clean working tree.

## Hints
- `git merge feature` will stop with a conflict.
- Edit `config.yaml` to the final content you want and delete the
  `<<<<<<<`, `=======`, `>>>>>>>` markers.
- `git add config.yaml` then `git commit` (Git pre-fills the merge message).
- Stuck? `git merge --abort` resets and you can try again.

## Check your work
```
./onboard validate git/03
```
