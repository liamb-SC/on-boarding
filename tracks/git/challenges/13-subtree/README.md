# 13 · Vendor code with subtree

**Skills:** `git subtree add --squash`, subtree vs. submodule

## Subtree vs. submodule
A **subtree** copies another repo's files *into* yours as **real files**, with
its history folded in (optionally squashed). Compared with a submodule:

| | Submodule (12) | Subtree (this one) |
|---|---|---|
| Stores | a pointer (gitlink) | the actual files |
| Cloners need extra steps | yes (`--recurse-submodules`) | no |
| `.gitmodules` | yes | no |
| Updating | `git submodule update` | `git subtree pull` |

Subtree is friendlier for people cloning your repo — nothing special to init.

## Scenario
Same setup as before: `app.js` imports `./vendor/lib/helper.js`, and an upstream
library repo exists on disk (path saved in `.git/note_upstream`).

## Goal
Use `git subtree` to add that library's contents under `vendor/lib` as real,
committed files — **no submodule, no `.gitmodules`**.

## Steps
```bash
git subtree add --prefix=vendor/lib "$(cat .git/note_upstream)" main --squash
```
- `--prefix` is where the files land; `main` is the upstream branch to pull;
  `--squash` collapses the upstream history into one commit (keeps your log tidy).
- Look at `git log --oneline` — you'll see the squashed import plus a merge.

## Check your work
```
./onboard validate git/13
```
