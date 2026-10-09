#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"

if ! command -v ssh-keygen >/dev/null 2>&1; then
  echo "This challenge needs ssh-keygen (OpenSSH), which wasn't found on your PATH." >&2
  echo "Install OpenSSH and run ./onboard start git/11 again." >&2
  exit 1
fi

sandbox_reset

# An existing, UNSIGNED commit — so you can see the contrast with a signed one.
sb_commit "README.md" "# Release notes" "Add readme (unsigned)"

# The file you'll add in a *signed* commit.
sb_write "release.txt" "v1.0.0"

# Generate an ephemeral SSH signing key for this challenge, stored inside .git
# so it never clutters the working tree. Real life: this is your ~/.ssh key.
key="$SANDBOX_DIR/.git/onboarding_signing_key"
ssh-keygen -t ed25519 -N '' -C 'onboarding@stepchange' -f "$key" -q

# Tell this repo to trust that key for our practice identity, so signatures can
# be *verified* offline (no GitHub round-trip needed).
printf '%s %s\n' "learner@onboarding.local" "$(cat "$key.pub")" \
  > "$SANDBOX_DIR/.git/allowed_signers"

# Preconfigure the SSH-signing plumbing. Your job is to point git at the key and
# actually sign — see the README.
sbg config gpg.format ssh
sbg config gpg.ssh.allowedSignersFile "$SANDBOX_DIR/.git/allowed_signers"
