# 21 · Tag a release (and ship a hotfix)

**Skills:** `git tag -a`, tagging a past commit, `git push origin <tag>`,
deleting a tag locally and on the remote, cutting a hotfix from a tag,
`git describe`.

## Why tags?
A branch moves every time someone commits. A **tag** is a fixed name for one
commit — "this exact code is version 1.1.0". Releases, deploys and changelogs
all hang off tags, so they need to be right.

- **Annotated** tags (`git tag -a`) are full objects with a tagger, date and
  message. Use these for releases.
- **Lightweight** tags (`git tag <name>`) are just a pointer — fine for local
  bookmarks, not for releases.
- `git push` does **not** push tags. You push them explicitly.

## Scenario
You're the release manager. `origin` already has `v1.0.0`. On `main` (newest
last):

```
Initial app              <-- v1.0.0
Add report export        <-- someone pushed a lightweight tag "v1.1" here by mistake
Release 1.1.0            <-- the actual release commit (VERSION = 1.1.0)
WIP: dark mode toggle    <-- unreleased work, must NOT be in any 1.1.x release
```

## Goal
Run a full release cycle:

1. **Release** — tag the `Release 1.1.0` commit as an **annotated** tag
   `v1.1.0` and push it to origin. (Not HEAD — dark mode isn't ready.)
2. **Clean up** — delete the mistaken `v1.1` tag, both locally **and** on
   origin.
3. **Hotfix** — a customer reports the export says `CVS` instead of `CSV`.
   Ship `v1.1.1`: branch from `v1.1.0`, fix `export.sh`, set `VERSION` to
   `1.1.1`, commit, tag it as an **annotated** `v1.1.1`, push the tag. It must
   not contain the dark mode work.
4. **Merge back** — merge the hotfix into `main` and push `main`, so the next
   release doesn't bring the bug back.

## Hints
- `git log --oneline --decorate` shows commits and the tags on them.
- `git tag -a <name> <commit> -m "..."` tags a commit other than HEAD.
- `git push origin <tag>` pushes one tag. Avoid `git push --tags` until the
  bad tag is gone locally, or you'll push it back.
- Deleting a remote tag: `git push origin --delete <tag>`.
- `git switch -c hotfix/1.1.1 v1.1.0` starts a branch at the tag.
- `git show v1.1.0` shows the tag message and tagger. `git cat-file -t v1.1.0`
  prints `tag` if it's annotated, `commit` if lightweight.
- Once you're done, try `git describe` on `main`. It names the commit relative
  to the nearest tag, e.g. `v1.1.1-2-gabc1234`.

## Check your work
```
./onboard validate git/21
```
