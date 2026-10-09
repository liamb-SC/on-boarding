import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { check, expect, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { connect } from '../../ai-checks.mjs';

watchdog();
const file = path.join(SANDBOX, '.mcp.json');
const raw = existsSync(file) ? readFileSync(file, 'utf8') : '';
let servers = {};
const server = (name) => {
  const s = servers[name];
  expect(s, `no server named "${name}" under mcpServers`);
  return s;
};

await check('.mcp.json exists at the project root and is valid JSON with an "mcpServers" object', () => {
  expect(raw, 'create .mcp.json next to package.json');
  const j = JSON.parse(raw);
  expect(j.mcpServers && typeof j.mcpServers === 'object' && !Array.isArray(j.mcpServers), 'top level: { "mcpServers": { ... } }');
  servers = j.mcpServers;
});

await check('"orders" is a stdio server: command "node", args ["orders-server/server.js"]', () => {
  const s = server('orders');
  expect(!s.type || s.type === 'stdio', `type is "${s.type}"`);
  expect(s.command === 'node', `command is "${s.command}"`);
  expect(Array.isArray(s.args) && s.args.length === 1, 'args is an array with the script path');
  expect(path.normalize(s.args[0]) === path.normalize('orders-server/server.js') || path.resolve(SANDBOX, s.args[0]) === path.join(SANDBOX, 'orders-server/server.js'),
    `args[0] is "${s.args[0]}"`);
});

await check('"orders" gets its token from the environment: "env": { "ORDERS_API_TOKEN": "${ORDERS_API_TOKEN}" }', () => {
  const v = server('orders').env?.ORDERS_API_TOKEN;
  expect(v !== undefined, 'add an "env" object with ORDERS_API_TOKEN');
  expect(/^\$\{ORDERS_API_TOKEN(:-[^}]*)?\}$/.test(v), `got "${v}". Reference the variable, don't paste the value`);
});

await check('"brightwell-docs" is a remote http server at https://mcp.brightwell.example/docs', () => {
  const s = server('brightwell-docs');
  expect(s.type === 'http', `type is "${s.type}". Remote servers use "http"`);
  expect(s.url === 'https://mcp.brightwell.example/docs', `url is "${s.url}"`);
  expect(!s.command, 'remote servers have a url, not a command');
});

await check('"brightwell-docs" sends "Authorization: Bearer ${DOCS_MCP_TOKEN}"', () => {
  const h = server('brightwell-docs').headers ?? {};
  expect(/^Bearer \$\{DOCS_MCP_TOKEN(:-[^}]*)?\}$/.test(h.Authorization ?? ''), `headers.Authorization is "${h.Authorization ?? ''}"`);
});

await check('no secrets in .mcp.json (it gets committed, so values must come from ${VARS})', () => {
  for (const secret of ['ord_live_', 'docs_live_']) expect(!raw.includes(secret), `remove the ${secret}... value`);
});

// Prove the config really works: start "orders" exactly as a client would,
// expanding ${VAR} / ${VAR:-default} from an environment we control.
await check('a client using this config can start "orders" and list its tools', async () => {
  const env = { ORDERS_API_TOKEN: 'validator-token' };
  const expand = (s) => String(s).replace(/\$\{(\w+)(?::-([^}]*))?\}/g, (_, k, d) => env[k] ?? d ?? '');
  const s = server('orders');
  const mcp = await connect({
    command: expand(s.command) === 'node' ? process.execPath : expand(s.command),
    args: (s.args ?? []).map(expand),
    env: Object.fromEntries(Object.entries(s.env ?? {}).map(([k, v]) => [k, expand(v)])),
  });
  const { tools } = await mcp.client.listTools();
  await mcp.client.close();
  expect(tools.some((t) => t.name === 'get_order_status'), `tools: ${tools.map((t) => t.name).join(', ')}`);
});
