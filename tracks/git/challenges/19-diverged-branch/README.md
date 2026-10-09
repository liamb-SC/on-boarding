# 19 · "Your branch and origin have diverged"

**Skills:** `git fetch`, `git rebase` / `git merge`, `git pull --rebase`

## Scenario
You committed locally (`D: my local change`), but a teammate pushed a different
commit (`C: teammate change`) to `origin/main`. You've already fetched, so
`git status` now says:

```
Your branch and 'origin/main' have diverged,
and have 1 and 1 different commits each, respectively.
```

Both sides have one commit the other doesn't. A plain `git push` will be rejected.

## Goal
Reconcile the two so that **both** commits end up on `main`, then push. Afterwards
`origin/main` must contain your `local.txt` **and** the teammate's `teammate.txt`.

## Steps (pick one reconciliation style)
```bash
git log --oneline --graph --all        # see the divergence

# Option A — rebase your work on top of theirs (linear history, preferred here):
git rebase origin/main
git push

# Option B — merge instead (creates a merge commit):
#   git merge origin/main
#   git push
```
- Next time, `git pull --rebase` does the fetch + rebase in one step.
- No conflicts here — the two commits touch different files.

## Check your work
```
./onboard validate git/19
```
