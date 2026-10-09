#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

sandbox_reset
# One entry per question in the README: the answer, and the MDN page you found it on.
node -e '
  const keys = ["semanticElement", "colorInput", "flexShrinkInitial", "stickyPosition", "sortedCopy",
                "tooManyRequests", "corsHeader", "announceUpdates", "deepCopy"];
  const blank = Object.fromEntries(keys.map((k) => [k, { answer: "", source: "" }]));
  process.stdout.write(JSON.stringify(blank, null, 2) + "\n");
' | put answers.json
sb_commit_all "Blank MDN scavenger hunt"
