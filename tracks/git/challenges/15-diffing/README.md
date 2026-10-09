# 15 · Diff branches & read the graph

**Skills:** `git diff <a> <b>`, `git log --graph`, the `A..B` range syntax,
`git merge-base`

## Scenario
`main` and `feature` share some history, then diverge:

```
* F2  bump config to v2   (feature)
* F1  feature part 1
| * M1  main work          (main)
|/
* B   config v1
* A   base
```

## Goal
Compare the two branches and fill in `answers.txt`:

| Key | Question |
|-----|----------|
| `files_differ` | How many files differ between `main` and `feature`? |
| `ahead`        | How many commits are on `feature` but **not** `main`? |
| `behind`       | How many commits are on `main` but **not** `feature`? |
| `merge_base`   | SHA of their common ancestor (where they diverged). |

## Techniques to try
```bash
git log --oneline --graph --all        # see the shape of the two branches
git diff --name-only main feature      # which files differ between the tips
git diff main feature                  # the actual line-by-line differences
git rev-list --count main..feature     # count commits on feature not in main
git rev-list --count feature..main     # ...and the other direction
git merge-base main feature            # the common ancestor commit
```
`A..B` means "reachable from B but not A" — the mental model behind ahead/behind.

## Check your work
```
./onboard validate git/15
```
