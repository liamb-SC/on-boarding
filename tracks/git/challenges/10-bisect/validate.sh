#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

expected="$(cat "$SANDBOX_DIR/.git/note_bad_sha" 2>/dev/null)"
answer_raw="$({ tr -d '[:space:]' < "$SANDBOX_DIR/bisect_answer.txt"; } 2>/dev/null)"
answer_full="$(g rev-parse "$answer_raw" 2>/dev/null)"

if [ -z "$answer_raw" ]; then
  _bad "write the guilty commit's SHA into bisect_answer.txt" "file empty or missing"
  _checks_total=$((_checks_total + 1)); _checks_failed=$((_checks_failed + 1))
fi
assert_eq "bisect_answer.txt names the first bad commit (c5)" "$expected" "$answer_full"
finish
