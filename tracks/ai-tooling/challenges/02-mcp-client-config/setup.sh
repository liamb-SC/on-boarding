#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
FIX="$REPO_ROOT/tracks/ai-tooling/fixtures"
cp "$FIX/package.json" "$FIX/orders.js" "$SANDBOX_DIR/"
mkdir -p "$SANDBOX_DIR/orders-server"
cp "$FIX/orders-server/server.js" "$SANDBOX_DIR/orders-server/"
printf 'node_modules/\n' | put .gitignore
in_sandbox npm pkg set scripts.inspect="npx -y @modelcontextprotocol/inspector node orders-server/server.js"
npm_install_sandbox
sb_commit_all "Orders MCP server"

# A local secret, deliberately left uncommitted and not yet ignored.
put .env <<'ENV'
# Local secrets. Never commit this file.
ORDERS_API_TOKEN=ord_live_5fK9wQ2zT8xM
DOCS_MCP_TOKEN=docs_live_Jp3nR7vY1cLs
ENV
