# 04 · Clean up history with interactive rebase

**Skills:** `git rebase -i`, squash/fixup, reword

## Scenario
The `main` branch has five commits, but three of them are noise:

```
Add login form
wip
fix typo
Add validation
wip more validation
```

Before opening a PR you want a clean, readable history.

## Goal
Use interactive rebase to squash the noise into meaningful commits — end with
**3 commits or fewer**, none of them containing "wip" or "typo", and both
`login.js` and `validation.js` still present.

## Hints
- `git rebase -i --root` (or `git rebase -i HEAD~5`) opens the todo list.
- Change `pick` to `squash` (combine + keep messages) or `fixup` (combine +
  discard message) on the noise commits.
- `reword` lets you fix a commit message.
- Made a mess? `git rebase --abort` starts over.

## Check your work
```
./onboard validate git/04
```
