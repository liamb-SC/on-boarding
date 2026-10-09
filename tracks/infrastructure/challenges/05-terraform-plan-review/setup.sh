#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

# No Terraform or Docker needed: the plan was already made, you just review it.
rm -rf "$SANDBOX_DIR" && mkdir -p "$SANDBOX_DIR"
cp "$REPO_ROOT/tracks/infrastructure/fixtures/plan-review/plan.json" "$SANDBOX_DIR/plan.json"
put answers.json <<'JSON'
{
  "created": [],
  "updated": [],
  "replaced": [],
  "destroyed": [],
  "create_before_destroy": [],
  "db_replaced_because_of": "",
  "iam_role_moved_from": "",
  "summary": { "add": 0, "change": 0, "destroy": 0 }
}
JSON
