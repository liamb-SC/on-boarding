#!/usr/bin/env bash
# lib/progress.sh — per-user completion records at progress/<user>.json
#
# Pure bash (printf to write, grep to read). jq is NOT required; if present it is
# only used to pretty-print in `onboard progress`. The local file is git-ignored;
# `onboard share` publishes it to the user's own progress/<user> branch.

set -o pipefail
: "${REPO_ROOT:?REPO_ROOT must be set}"

_PROGRESS_ENTRY_RE='\{"id": "[^"]*", "completed_at": "[^"]*", "sha": "[^"]*"\}'

progress_file() { printf '%s/progress/%s.json' "$REPO_ROOT" "$1"; }

# progress_is_done <challenge-id> <user>
progress_is_done() {
  local file; file="$(progress_file "$2")"
  [ -f "$file" ] && grep -q "\"id\": \"$1\"" "$file"
}

# progress_count <user> — number of completed challenges
progress_count() {
  local file n=0; file="$(progress_file "$1")"
  [ -f "$file" ] && n="$(grep -c '"id":' "$file")"
  echo "${n:-0}"
}

# progress_entries — progress JSON on stdin, one entry object per line out
# (comma-agnostic, so it also reads files written by older versions).
progress_entries() { grep -oE "$_PROGRESS_ENTRY_RE" || true; }

# progress_write <user> — entry objects on stdin; rewrites the user's file with
# them in completion order.
progress_write() {
  local user="$1" file line; file="$(progress_file "$user")"
  local -a entries=()
  while IFS= read -r line; do
    [ -n "$line" ] && entries+=("$line")
  done < <(sort -s -t'"' -k8,8)   # field 8 is the completed_at timestamp
  mkdir -p "$(dirname "$file")"
  {
    printf '{\n'
    printf '  "user": "%s",\n' "$user"
    printf '  "completed": [\n'
    local i n=${#entries[@]}
    for i in "${!entries[@]}"; do
      if [ "$i" -lt $((n - 1)) ]; then printf '    %s,\n' "${entries[$i]}"
      else printf '    %s\n' "${entries[$i]}"; fi
    done
    printf '  ]\n'
    printf '}\n'
  } > "$file"
}

# progress_mark <challenge-id> <sha> <user> — idempotent append
progress_mark() {
  local id="$1" sha="$2" user="$3"
  local file; file="$(progress_file "$user")"
  local ts; ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

  # Already recorded? do nothing.
  if [ -f "$file" ] && grep -q "\"id\": \"$id\"" "$file"; then
    return 0
  fi

  {
    [ -f "$file" ] && progress_entries < "$file"
    printf '%s\n' "{\"id\": \"$id\", \"completed_at\": \"$ts\", \"sha\": \"$sha\"}"
  } | progress_write "$user"
}

# progress_merge <user> — progress JSON on stdin (e.g. what's already shared);
# adds any entries the user's local file lacks. Prints how many were added.
progress_merge() {
  local user="$1" file; file="$(progress_file "$user")"
  local incoming existing="" line id added=0
  incoming="$(progress_entries)"
  [ -f "$file" ] && existing="$(progress_entries < "$file")"

  local merged="$existing"
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    id="${line#\{\"id\": \"}"; id="${id%%\"*}"
    if ! grep -qF "\"id\": \"$id\"" <<<"$existing"; then
      merged+=$'\n'"$line"; added=$((added + 1))
    fi
  done <<<"$incoming"

  [ "$added" -gt 0 ] && printf '%s\n' "$merged" | progress_write "$user"
  echo "$added"
}
