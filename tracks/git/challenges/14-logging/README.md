# 14 · Log like a detective

**Skills:** `git log --author`, `git log -- <path>`, `git log -S` (pickaxe),
`--oneline`, `--format`

## Scenario
This repo has six commits from three authors (Alice, Bob, Carol). Somewhere in
there a `SECRET_KEY` was committed. Your job is to interrogate the history with
`git log` — **not** by reading every commit by hand.

## Goal
Fill in `answers.txt` (already in your sandbox) with:

| Key | Question |
|-----|----------|
| `alice_commits` | How many commits did **Alice** author? |
| `app_changes`   | How many commits changed **`src/app.js`**? |
| `secret_commit` | The SHA of the commit that **introduced** `SECRET_KEY`. |

## Techniques to try
```bash
git log --oneline                      # compact overview
git log --author=Alice --oneline       # filter by author
git log --oneline -- src/app.js        # commits touching a path
git log -S 'SECRET_KEY' --oneline      # "pickaxe": commits that changed this text
git log --format='%h %an %s'           # custom format (hash, author, subject)
```
Put each value after the `=` in `answers.txt`. Any length of SHA is fine.

## Check your work
```
./onboard validate git/14
```
