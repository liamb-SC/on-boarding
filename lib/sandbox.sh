#!/usr/bin/env bash
# lib/sandbox.sh — helpers sourced by every challenge's setup.sh to build a
# throwaway practice repo. The runner exports SANDBOX_DIR (target path) first.
#
# These keep setup scripts short and give every sandbox a deterministic identity
# so validators are reproducible across machines and employees.

set -o pipefail
: "${SANDBOX_DIR:?SANDBOX_DIR must be set by the onboard runner}"

# sbg: git against the sandbox
sbg() { git -C "$SANDBOX_DIR" "$@"; }

# sandbox_reset — wipe and re-init a clean repo on branch main
sandbox_reset() {
  rm -rf "$SANDBOX_DIR"
  mkdir -p "$SANDBOX_DIR"
  sbg init -q -b main
  sbg config user.name  "Practice Learner"
  sbg config user.email "learner@onboarding.local"
  sbg config commit.gpgsign false
  sbg config advice.detachedHead false
  # Keep line endings LF regardless of the host's global autocrlf, so scripts
  # and content behave identically on Linux, macOS and Windows/WSL.
  sbg config core.autocrlf false
  sbg config core.eol lf
}

# sb_write <relpath> <content>   — write a file (uncommitted)
sb_write() {
  local dir; dir="$(dirname "$SANDBOX_DIR/$1")"
  mkdir -p "$dir"
  printf '%s\n' "$2" > "$SANDBOX_DIR/$1"
}

# sb_commit <relpath> <content> <message>  — write, stage, commit one file
sb_commit() {
  sb_write "$1" "$2"
  sbg add "$1"
  sbg commit -q -m "$3"
}

# sb_commit_all <message>  — stage everything and commit
sb_commit_all() {
  sbg add -A
  sbg commit -q -m "$1"
}

# sb_stash_note <key> <value>  — persist a value the validator needs, hidden
# inside .git so it survives checkouts and never pollutes the working tree.
sb_stash_note() { printf '%s' "$2" > "$SANDBOX_DIR/.git/note_$1"; }
