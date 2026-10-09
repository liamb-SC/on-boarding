#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"
run_checks node "$(dirname "${BASH_SOURCE[0]}")/check.mjs"

assert_true  ".mcp.json is committed (project config is shared with the team)" git_tracked .mcp.json
assert_true  ".env is ignored by git" g check-ignore -q .env
assert_false ".env has never been committed" test -n "$(g log --all --format=%H -- .env 2>/dev/null)"
finish
