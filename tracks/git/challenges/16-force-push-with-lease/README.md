# 16 · Force-push safely with --force-with-lease

**Skills:** `git push --force-with-lease`, `git fetch`, recovering from a
diverged remote — and why plain `--force` is dangerous.

## ⚠️ Read this first — the danger
When you rewrite history (amend, rebase, squash) you can no longer push normally,
because your branch no longer fast-forwards. It's tempting to reach for:

```bash
git push --force        # ☠️  DANGEROUS
```

`--force` says *"make the remote look exactly like me, whatever is there."* If a
teammate pushed to that branch since you last fetched, **`--force` silently
deletes their commits.** They're just gone from the remote.

The safe alternative:

```bash
git push --force-with-lease   # ✅ refuses if the remote moved unexpectedly
```

`--force-with-lease` says *"force, but ONLY if the remote is still where I last
saw it."* If someone else pushed, it **refuses** and tells you — so you can look
before you overwrite.

## Scenario
You pushed a `feature` branch containing commit **C** ("add feature") — but it
has a typo (`widht`). While you weren't looking, a **teammate pushed a commit**
to `origin/feature` (their `review-fix.txt`). You don't know that yet.

## Goal
Fix the typo by amending your commit, and get your fix onto `origin/feature`
**without destroying the teammate's commit**. The validator checks that both your
fix *and* their `review-fix.txt` end up on origin.

## Steps
```bash
# 1. Fix the typo and amend your commit (this rewrites history)
#    edit feature.txt: widht -> width
git add feature.txt
git commit --amend --no-edit

# 2. Try the safe force — it will be REFUSED ("stale info"). Good! It just
#    saved your teammate's work.
git push --force-with-lease

# 3. See what actually changed on the remote
git fetch origin
git log origin/feature --oneline      # spot the teammate's commit

# 4. Bring their commit onto your rewritten branch (no conflict here)
git cherry-pick <that-commit-sha>

# 5. Now the lease matches reality, so this succeeds
git push --force-with-lease
```

Try the reckless path if you like: `./onboard reset git/16`, then
`git commit --amend` and `git push --force` — validate and watch the teammate's
work vanish. That's the whole lesson.

## Check your work
```
./onboard validate git/16
```
