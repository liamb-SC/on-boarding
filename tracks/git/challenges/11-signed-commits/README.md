# 11 · Sign your commits (SSH)

**Skills:** commit signing, `git commit -S`, `git log --show-signature`

## Why this matters
On protected branches we want to know a commit really came from who it claims
to. A **signed** commit proves that. GitHub shows a green *Verified* badge for
them. We use **SSH signing** (the same key type you already use to push).

## Scenario
Your sandbox has one **unsigned** commit and an uncommitted file, `release.txt`.
It's been pre-wired for SSH signing:
- a signing key was generated at `.git/onboarding_signing_key` (public half:
  `.git/onboarding_signing_key.pub`);
- the repo already trusts that key for your identity, so signatures can be
  **verified offline** (no GitHub needed).

## Goal
Create a **signed** commit that adds `release.txt`, with a message mentioning the
**release**, and confirm git verifies it as good.

## Steps (run these inside the sandbox)
```bash
# 1. Point git at the signing key (public-key path is fine for SSH signing)
git config user.signingkey ".git/onboarding_signing_key.pub"

# 2. Stage and make a SIGNED commit (-S signs this one commit)
git add release.txt
git commit -S -m "Sign the v1.0.0 release"

# 3. Confirm it's verified
git log --show-signature -1      # look for: Good "git" signature ...
```

Tip: `git config commit.gpgsign true` makes **every** commit sign automatically —
that's how you'd set it up for real (usually `--global`).

## Hints
- The plumbing (`gpg.format ssh`, the trusted-signers file) is already set —
  you only need `user.signingkey` and the `-S` flag.
- `git log --format='%G?' -1` prints `G` for a good signature, `N` for none.

## Check your work
```
./onboard validate git/11
```
