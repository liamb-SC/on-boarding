#!/usr/bin/env bash
# lib/common.sh — validator toolkit sourced by every challenge's validate.sh
#
# Contract: the runner exports SANDBOX_DIR (the learner's practice repo) before
# invoking validate.sh. Validators call the assert_* helpers, then finish.
#
# No dependency beyond git + coreutils. Never uses `set -e` so a failing check
# is reported, not fatal.

set -o pipefail

# ----- presentation -------------------------------------------------------
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  RED=; GREEN=; YELLOW=; BOLD=; DIM=; RESET=
fi

SANDBOX_DIR="${SANDBOX_DIR:-$PWD}"
_checks_total=0
_checks_failed=0

# g: run git against the sandbox repo regardless of the caller's cwd
g() { git -C "$SANDBOX_DIR" "$@"; }

# ----- git state helpers (echo values or return status) -------------------
git_log_count()          { g rev-list --count HEAD 2>/dev/null || echo 0; }
git_current_branch()     { g rev-parse --abbrev-ref HEAD 2>/dev/null; }
git_commit_subjects()    { g log --format=%s 2>/dev/null; }
git_working_tree_clean() { [ -z "$(g status --porcelain 2>/dev/null)" ]; }
git_is_linear_history()  { [ -z "$(g rev-list --merges HEAD 2>/dev/null)" ]; }
git_has_merge_commit()   { [ -n "$(g rev-list --merges HEAD 2>/dev/null)" ]; }
git_ref_exists()         { g rev-parse --verify --quiet "$1" >/dev/null 2>&1; }
git_reflog_contains()    { g reflog 2>/dev/null | grep -qiF -- "$1"; }
git_branch_merged()      { g branch --merged 2>/dev/null | grep -qE "(^|\s)\*?\s*$1$"; }
# is $1 (a ref/sha) contained in the current HEAD history?
git_in_history()         { g merge-base --is-ancestor "$1" HEAD 2>/dev/null; }
# file tracked at HEAD?
git_tracked()            { g cat-file -e "HEAD:$1" 2>/dev/null; }
# contents of a tracked file at HEAD
git_show()               { g show "HEAD:$1" 2>/dev/null; }

# ----- assertions ---------------------------------------------------------
_ok()  { printf '  %s✓%s %s\n' "$GREEN" "$RESET" "$1"; }
_bad() { printf '  %s✗%s %s%s\n' "$RED" "$RESET" "$1" "${2:+ ${DIM}$2${RESET}}"; }

# assert_true "desc" command args...   (passes if command exits 0)
assert_true() {
  local desc="$1"; shift
  _checks_total=$((_checks_total + 1))
  if "$@" >/dev/null 2>&1; then _ok "$desc"; else _checks_failed=$((_checks_failed + 1)); _bad "$desc"; fi
}

# assert_false "desc" command args...  (passes if command exits non-zero)
assert_false() {
  local desc="$1"; shift
  _checks_total=$((_checks_total + 1))
  if "$@" >/dev/null 2>&1; then _checks_failed=$((_checks_failed + 1)); _bad "$desc"; else _ok "$desc"; fi
}

# assert_eq "desc" expected actual
assert_eq() {
  _checks_total=$((_checks_total + 1))
  if [ "$2" = "$3" ]; then _ok "$1"; else _checks_failed=$((_checks_failed + 1)); _bad "$1" "expected '$2', got '$3'"; fi
}

# assert_ge "desc" min actual   (numeric >=)
assert_ge() {
  _checks_total=$((_checks_total + 1))
  if [ "$3" -ge "$2" ] 2>/dev/null; then _ok "$1"; else _checks_failed=$((_checks_failed + 1)); _bad "$1" "expected >= $2, got '$3'"; fi
}

# assert_contains "desc" haystack needle
assert_contains() {
  _checks_total=$((_checks_total + 1))
  if printf '%s' "$2" | grep -qiF -- "$3"; then _ok "$1"; else _checks_failed=$((_checks_failed + 1)); _bad "$1" "'$3' not found"; fi
}

# assert_not_contains "desc" haystack needle
assert_not_contains() {
  _checks_total=$((_checks_total + 1))
  if printf '%s' "$2" | grep -qiF -- "$3"; then _checks_failed=$((_checks_failed + 1)); _bad "$1" "'$3' should not be present"; else _ok "$1"; fi
}

# ----- summary + exit code ------------------------------------------------
finish() {
  printf '\n'
  if [ "$_checks_failed" -eq 0 ]; then
    printf '%s✓ PASS%s — all %d checks passed\n' "$BOLD$GREEN" "$RESET" "$_checks_total"
    exit 0
  fi
  printf '%s✗ FAIL%s — %d of %d checks failed. Keep going and re-run validate.\n' \
    "$BOLD$RED" "$RESET" "$_checks_failed" "$_checks_total"
  exit 1
}
