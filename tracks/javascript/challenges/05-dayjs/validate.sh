#!/usr/bin/env bash
source "$REPO_ROOT/lib/common.sh"
source "$REPO_ROOT/lib/node.sh"
# Run in a time zone far from UTC, so code that leans on the machine's local
# time gives itself away. (UTC+14: it's already "tomorrow" there.)
run_checks env TZ=Pacific/Kiritimati node "$(dirname "${BASH_SOURCE[0]}")/check.mjs"
finish
