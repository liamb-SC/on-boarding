# 17 · Reset and clean a messy working tree

**Skills:** `git reset --hard`, `git clean`, `git status`

## Scenario
Your working tree is a mess after some experimenting:
- `app.js` has a broken change **that's already staged**;
- `README.md` has an unstaged accidental edit;
- there's untracked junk: `debug.log` and a `build/` directory.

You want to get back to a pristine checkout of the last commit — throw all of it
away.

## Goal
Make `git status` completely clean: `app.js` and `README.md` back to their
committed versions, and the untracked junk gone from disk — **without** adding a
new commit.

## Hints
```bash
git status                 # see staged, unstaged, and untracked separately
git reset --hard           # discard ALL staged + unstaged changes to tracked files
git clean -n -d            # DRY RUN: preview which untracked files/dirs would go
git clean -f -d            # actually remove untracked files and directories
```
- `reset --hard` does **not** touch untracked files — that's why you also need
  `git clean`.
- ⚠️ Both are destructive and skip the "are you sure?" — that's what `git clean -n`
  (dry run) is for. There's no undo for uncommitted work.

## Check your work
```
./onboard validate git/17
```
