# Track: Git

The everyday Git skills our workflow depends on — clean history, confident
recovery, and safe collaboration on protected branches.

## Learning objectives
By the end you can:
- Stage, commit, branch and merge with intent.
- Resolve merge conflicts calmly.
- Reshape history with interactive rebase and `rebase` onto a moved base.
- Recover "lost" work with the reflog.
- Move individual commits with cherry-pick.
- Fix the last commit with `--amend`.
- Park work-in-progress with stash.
- Hunt down a regression with bisect.
- Sign commits so they show as verified.
- Embed other repos with submodules and subtree.
- Interrogate history with log and diff techniques.
- Force-push safely with `--force-with-lease`.
- Discard local mess with `reset` and `clean`.
- Undo a shared commit with `revert`.
- Reconcile a branch that has diverged from origin.
- Rename branches.
- Cut and tag releases, including a hotfix from a release tag.

## Challenges (do them in order)
| # | Challenge | Core commands |
|---|-----------|---------------|
| 01 | first-commit | `add`, `commit`, `status` |
| 02 | branch-and-merge | `branch`, `switch`, `merge` |
| 03 | merge-conflict | conflict resolution, `merge` |
| 04 | interactive-rebase | `rebase -i`, squash/fixup |
| 05 | rebase-onto | `rebase`, linear history |
| 06 | reflog-recovery | `reflog`, `reset`/`cherry-pick` |
| 07 | cherry-pick | `cherry-pick` |
| 08 | amend-and-fixup | `commit --amend` |
| 09 | stash | `stash`, `stash pop` |
| 10 | bisect | `bisect`, `bisect run` |
| 11 | signed-commits | `commit -S`, SSH signing, `--show-signature` |
| 12 | submodules | `submodule add`, `.gitmodules`, gitlinks |
| 13 | subtree | `subtree add --squash`, subtree vs submodule |
| 14 | logging | `log --author`, `log -- <path>`, `log -S` (pickaxe) |
| 15 | diffing | `diff <a> <b>`, `log --graph`, `A..B`, `merge-base` |
| 16 | force-push-with-lease | `push --force-with-lease` vs `--force` |
| 17 | reset-and-clean | `reset --hard`, `clean -fd` |
| 18 | revert | `revert` (undo an earlier commit safely) |
| 19 | diverged-branch | `fetch` + `rebase`/`merge`, `pull --rebase` |
| 20 | branch-rename | `branch -m` |
| 21 | release-tagging | `tag -a`, `push origin <tag>`, `push --delete`, hotfix from a tag, `describe` |

Start with: `./onboard start git/01`
