# 18 · Undo an earlier commit with revert

**Skills:** `git revert`, undoing shared history safely

## reset vs. revert
To undo a commit you *haven't shared*, you can `reset`. But once a commit is on a
shared branch — or has good work stacked on top of it — rewriting history is
risky. **`git revert`** is the safe undo: it creates a **new** commit that applies
the inverse of the target, leaving everything after it intact.

## Scenario
History looks like this (newest last):

```
Add app
Add feature
Add debug backdoor   <-- bad commit, must go (its SHA is in .git/note_bad_sha)
Polish UI            <-- good work done AFTER it, must be kept
```

## Goal
Undo **only** the "Add debug backdoor" commit so `backdoor.js` disappears, while
`feature.js` and `polish.js` stay. Do it with a revert (which adds a new commit),
not by erasing history.

## Steps
```bash
git log --oneline                       # find the bad commit
git revert $(cat .git/note_bad_sha)     # or: git revert <sha>   (add --no-edit to keep the default message)
```
- Revert creates a commit titled `Revert "Add debug backdoor"`.
- `git show HEAD` afterwards shows it simply removed `backdoor.js`.

## Check your work
```
./onboard validate git/18
```
