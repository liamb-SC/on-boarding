# 02 · Register MCP servers in a client config

**Skills:** project-scoped MCP config (`.mcp.json`), stdio vs remote (`http`)
servers, `${ENV_VAR}` expansion, keeping secrets out of shared config.

## Background
An MCP client needs to know which servers exist and how to reach them.
Claude Code reads a project's **`.mcp.json`**. Because it lives in the
repo, everyone on the team gets the same servers:

```json
{
  "mcpServers": {
    "my-local-tool": {
      "type": "stdio",
      "command": "node",
      "args": ["tools/server.js"],
      "env": { "API_KEY": "${MY_API_KEY}" }
    },
    "my-remote-tool": {
      "type": "http",
      "url": "https://example.com/mcp",
      "headers": { "Authorization": "Bearer ${MY_TOKEN}" }
    }
  }
}
```
- A **stdio** server is a local program the client starts (`command` + `args`).
- An **http** server is already running somewhere. The client connects to its `url`.
- `${VAR}` (or `${VAR:-default}`) is expanded from the user's environment when
  the server starts. The file gets **committed**, so it must never contain a
  real secret. Each person keeps their own values in their environment or
  an ignored `.env` file.

## Scenario
The orders MCP server from challenge 01 now lives in `orders-server/`. It
refuses to start without `ORDERS_API_TOKEN`. The docs team also runs a
remote MCP server. Your real tokens are in `.env`, which isn't ignored yet.

## Goal
1. Create `.mcp.json` at the project root with two servers:
   - **`orders`**: stdio, runs `node orders-server/server.js`, and passes
     `ORDERS_API_TOKEN` through from the environment.
   - **`brightwell-docs`**: `http`, URL `https://mcp.brightwell.example/docs`,
     with the header `Authorization: Bearer <DOCS_MCP_TOKEN from the environment>`.
2. Make sure `.env` can never be committed, then commit `.mcp.json` (and
   `.gitignore`).

The validator reads your config, then starts `orders` the way a client would
and lists its tools.

## Hints
- Use a path relative to the project root in `args`. Clients start
  project servers from there.
- With Claude Code installed, `claude mcp add` can write this file for you,
  e.g. `claude mcp add --transport http <name> <url> --header "Key: value" --scope project`
  (stdio servers take `--env VAR=value` and `-- <command> [args]`). Check the
  result: you still want `${VAR}` placeholders, not real secrets. `/mcp` inside
  a session shows each server's status. The docs server is fictional, so it
  will show as failed.

## Check your work
```
./onboard validate ai-tooling/02
```
