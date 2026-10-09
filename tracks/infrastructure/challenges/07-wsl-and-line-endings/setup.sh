#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

sandbox_reset

# to_crlf <relpath> — rewrite a sandbox file with Windows (CRLF) line endings,
# as if it was last saved by a Windows editor with autocrlf misconfigured.
to_crlf() { awk '{ printf "%s\r\n", $0 }' "$SANDBOX_DIR/$1" > "$SANDBOX_DIR/$1.tmp" && mv "$SANDBOX_DIR/$1.tmp" "$SANDBOX_DIR/$1"; }

put scripts/deploy.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source config/app.env
[[ "$PORT" =~ ^[0-9]+$ ]] || { echo "PORT is not a number: '$PORT'" >&2; exit 1; }
echo "deploying $APP_NAME on port $PORT"
SH
put config/app.env <<'ENV'
APP_NAME=shop
PORT=3000
ENV
put windows/run.bat <<'BAT'
@echo off
rem For colleagues on plain Windows. cmd.exe wants CRLF line endings.
wsl ./scripts/deploy.sh
BAT
for f in scripts/deploy.sh config/app.env windows/run.bat; do to_crlf "$f"; done
chmod +x "$SANDBOX_DIR/scripts/deploy.sh"
put README.md <<'MD'
# shop
Run `./scripts/deploy.sh` to deploy.
MD
sb_commit_all "Add deploy script (saved on Windows)"

put shell/aliases.sh <<'SH'
# Shell helpers. Source this from your ~/.bashrc or ~/.zshrc:
#   source /path/to/aliases.sh
# TODO: alias gs  -> git status -sb
# TODO: mkcd DIR  -> make DIR (and parents) and cd into it
# TODO: here      -> print the current directory as a Windows path when on WSL
#                    (wslpath -w), or the normal path everywhere else
SH
put answers.json <<'JSON'
{
  "q1": "",
  "q2": "",
  "q3": ""
}
JSON
