# Track: AI tooling

Working with AI coding tools: building and wiring up MCP (Model Context
Protocol) servers so an AI app can use your tools, and giving an agent the
context and instructions it needs to do a job right first time.

## Requirements
Node.js 20+ and network access to the npm registry. Challenges 01 and 02
install `@modelcontextprotocol/sdk` and `zod`. Claude Code is optional but
makes 02 and 03 more fun.

## Learning objectives
By the end you can:
- Explain what MCP servers, clients, tools and transports are.
- Build a stdio MCP server with `McpServer.registerTool`, zod input schemas, annotations and `isError` results.
- Register local (stdio) and remote (http) servers in a project `.mcp.json`, with secrets passed as `${ENV_VARS}`.
- Write a short, useful `CLAUDE.md` with commands, conventions and no-go areas.
- Turn a vague request into a prompt with location, evidence, a done-check and constraints.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | mcp-server | `McpServer`, `registerTool`, zod schemas, `readOnlyHint`, `isError`, stdio |
| 02 | mcp-client-config | `.mcp.json`, stdio vs `http` servers, `${VAR}` expansion, secrets |
| 03 | context-and-prompts | `CLAUDE.md`, task prompts: where, evidence, verify, constraints |

The validators act as a real MCP client: they start your server over stdio
with the official SDK, list its tools and call them.

Start with: `./onboard start ai-tooling/01`
