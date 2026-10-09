#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
FIX="$REPO_ROOT/tracks/ai-tooling/fixtures"
cp "$FIX/package.json" "$FIX/orders.js" "$SANDBOX_DIR/"
printf 'node_modules/\n' | put .gitignore

put server.js <<'JS'
// An MCP server for Brightwell's support team, spoken over stdio.
// The client (Claude Code, an IDE, the validator...) starts this process and
// exchanges JSON-RPC messages on stdin/stdout.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { orders } from './orders.js';

const server = new McpServer({ name: 'orders', version: '1.0.0' });

// TODO 1: register a tool "get_order_status" (see README).

// TODO 2: register a tool "list_delayed_orders" (see README).

// stdout belongs to the protocol. Log to stderr (console.error), never console.log.
await server.connect(new StdioServerTransport());
JS

npm_install_sandbox
sb_commit_all "Orders data and an empty MCP server"
