#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

# main: A, B
sb_commit "a.txt" "A" "A: project init"
sb_commit "b.txt" "B" "B: add module"

# feature branched off B
sbg checkout -q -b feature
sb_commit "feature.txt" "feature work" "F: feature work"

# main moved on to C after feature branched
sbg checkout -q main
sb_commit "c.txt" "C" "C: important main update"

# Leave the learner on feature, based on the now-stale B.
sbg checkout -q feature
