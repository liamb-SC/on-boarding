# 01 · Build an MCP server

**Skills:** the Model Context Protocol (MCP), `McpServer`, `registerTool`,
zod input schemas, tool results and `isError`, the stdio transport.

## Background
**MCP** is an open protocol for giving AI applications (Claude Code, Claude
Desktop, IDEs...) access to tools and data. You write an **MCP server** once,
and any MCP **client** can use it. A server can expose:
- **tools**: functions the model can call (this challenge),
- **resources**: data the client can read,
- **prompts**: reusable prompt templates.

With the **stdio transport**, the client starts your server as a child
process and they exchange JSON-RPC messages over stdin/stdout. That's why a
stdio server must never `console.log`: stdout carries the protocol.

With the TypeScript SDK (`@modelcontextprotocol/sdk`), a tool looks like this:
```js
server.registerTool('add', {
  description: 'Add two numbers and return the sum.',   // the model reads this!
  inputSchema: { a: z.number().describe('First number'), b: z.number() },
  annotations: { readOnlyHint: true },                   // hint: no side effects
}, async ({ a, b }) => ({ content: [{ type: 'text', text: String(a + b) }] }));
```
A tool that fails returns `{ isError: true, content: [...] }`, so the model
sees the error and can recover. It doesn't throw.

## Scenario
Brightwell's support team wants Claude to answer "where's my parcel?"
questions. `orders.js` has the data. `server.js` is an MCP server with no
tools yet.

## Goal
Register two **read-only** tools in `server.js`:
1. **`get_order_status`** takes `orderId` (a required string, with a
   description). It returns the matching order from `orders.js` as **JSON
   text**: `JSON.stringify(order)`. If there's no such order, return a tool
   error (`isError: true`) whose text names the ID.
2. **`list_delayed_orders`** takes `carrier` (an optional string). It returns a
   JSON array of the IDs of delayed orders (`delayed: true`), filtered to that
   carrier if one is given.

Give each tool a description of at least 6 words saying what it does and
what it returns.

## Try it
```bash
npm run inspect      # opens the MCP Inspector in your browser (downloads it on first run)
```
Or skip that and let the validator be your client. It connects over stdio,
lists your tools and calls them.

## Hints
- Optional input: `z.string().optional()`.
- The SDK validates input against your schema before your handler runs.
- `node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.d.ts` has the
  full `registerTool` signature.

## Check your work
```
./onboard validate ai-tooling/01
```
