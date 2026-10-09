#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
sandbox_reset

# Shared history, then main and feature diverge.
sb_commit base.txt   "base"  "A: base"
sb_commit config.txt "v1"    "B: config v1"

sbg checkout -q -b feature
sb_commit feature1.txt "f1"  "F1: feature part 1"
sb_commit config.txt   "v2"  "F2: bump config to v2"

sbg checkout -q main
sb_commit main1.txt  "m1"    "M1: main work"

cat > "$SANDBOX_DIR/answers.txt" <<'EOF'
# Compare the main and feature branches. Fill in the values, then:
#   ./onboard validate git/15
files_differ=
ahead=
behind=
merge_base=
EOF
