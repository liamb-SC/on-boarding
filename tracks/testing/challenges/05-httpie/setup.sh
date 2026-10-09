#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need http "Install HTTPie first: pipx install httpie   (or: pip install --user httpie, brew install httpie)"

sandbox_reset
cp "$REPO_ROOT/tracks/testing/fixtures/notes-api.mjs" "$SANDBOX_DIR/"
mkdir -p "$SANDBOX_DIR/outputs"
put package.json <<'JSON'
{
  "name": "notes-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node notes-api.mjs"
  }
}
JSON

put commands.sh <<'SH2'
#!/usr/bin/env bash
# One httpie command per task. The validator runs this file against its own
# copy of the API, so always use "$BASE" for the host and port.
BASE="${BASE:-localhost:5055}"
TOKEN=dev-123

# When stdin isn't a terminal (as in a script), httpie reads it as the request
# body. --ignore-stdin turns that off; this wrapper adds it to every call.
http() { command http --ignore-stdin "$@"; }

# 1. Health check (done for you)
http GET "$BASE/health"

# 2. List notes tagged "urgent", at most 5, with the bearer token

# 3. Create a note: JSON title, numeric priority, tags array, token, X-Request-Id header

# 4. Send feedback as a form

# 5. Delete note 1, with the token

SH2
chmod +x "$SANDBOX_DIR/commands.sh"
sb_commit_all "Notes API and an httpie script to fill in"
