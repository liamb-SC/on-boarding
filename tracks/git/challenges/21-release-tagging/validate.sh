#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"

ORIGIN="${SANDBOX_DIR}-origin.git"
o() { git -C "$ORIGIN" "$@"; }
release_sha="$(cat "$SANDBOX_DIR/.git/note_release_sha" 2>/dev/null)"
wip_sha="$(cat "$SANDBOX_DIR/.git/note_wip_sha" 2>/dev/null)"
v100_sha="$(cat "$SANDBOX_DIR/.git/note_v100_sha" 2>/dev/null)"

# o_tag_type <tag> — "tag" for annotated, "commit" for lightweight, "" if missing
o_tag_type() { o cat-file -t "refs/tags/$1" 2>/dev/null; }
o_tag_commit() { o rev-parse --verify --quiet "refs/tags/$1^{commit}" 2>/dev/null; }

# --- 1. release v1.1.0 -----------------------------------------------------
assert_eq "v1.1.0 is on origin as an ANNOTATED tag" "tag" "$(o_tag_type v1.1.0)"
assert_eq "v1.1.0 points at the 'Release 1.1.0' commit (not HEAD of main)" \
          "$release_sha" "$(o_tag_commit v1.1.0)"
assert_eq "v1.0.0 on origin is untouched" "$v100_sha" "$(o_tag_commit v1.0.0)"

# --- 2. the mistaken tag ---------------------------------------------------
assert_false "the mistaken tag v1.1 is deleted locally" \
             g rev-parse --verify --quiet refs/tags/v1.1
assert_false "the mistaken tag v1.1 is deleted from origin" \
             o rev-parse --verify --quiet refs/tags/v1.1

# --- 3. hotfix v1.1.1 ------------------------------------------------------
hotfix="$(o_tag_commit v1.1.1)"
assert_eq   "v1.1.1 is on origin as an ANNOTATED tag" "tag" "$(o_tag_type v1.1.1)"
assert_true "v1.1.1 is built on top of v1.1.0" \
            o merge-base --is-ancestor "$release_sha" "${hotfix:-none}"
assert_false "v1.1.1 does NOT ship the unreleased 'WIP: dark mode' commit" \
             o merge-base --is-ancestor "$wip_sha" "${hotfix:-none}"
assert_eq "VERSION says 1.1.1 in the v1.1.1 release" \
          "1.1.1" "$(o show "v1.1.1:VERSION" 2>/dev/null | tr -d '[:space:]')"
export_v111="$(o show "v1.1.1:export.sh" 2>/dev/null)"
assert_contains     "the export bug is fixed in v1.1.1 (says CSV)" "$export_v111" "CSV"
assert_not_contains "the 'CVS' typo is gone in v1.1.1" "$export_v111" "CVS"

# --- 4. hotfix merged back so main doesn't regress -------------------------
assert_true "origin/main contains the v1.1.1 fix (hotfix merged back)" \
            o merge-base --is-ancestor "${hotfix:-none}" main
assert_true "origin/main still has the dark mode work" \
            o merge-base --is-ancestor "$wip_sha" main
finish
