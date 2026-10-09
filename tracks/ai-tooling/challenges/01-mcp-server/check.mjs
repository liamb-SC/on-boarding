import { check, expect, expectEqual, watchdog } from '../../../../lib/checks.mjs';
import { connect, jsonOf, textOf, toolNamed } from '../../ai-checks.mjs';

watchdog();
let mcp;
let tools = [];
const call = (name, args) => {
  toolNamed(tools, name);
  return mcp.client.callTool({ name, arguments: args });
};

await check('node server.js starts and completes the MCP handshake over stdio', async () => {
  mcp = await connect({ command: process.execPath, args: ['server.js'] });
  expect(mcp.client.getServerVersion()?.name === 'orders', 'the server should be called "orders"');
});
if (!mcp) process.exit(1);

await check('tools/list returns get_order_status and list_delayed_orders', async () => {
  try {
    ({ tools } = await mcp.client.listTools());
  } catch (e) {
    throw new Error(/-32601/.test(e.message) ? 'the server has no tools yet: register one with server.registerTool()' : e.message);
  }
  toolNamed(tools, 'get_order_status');
  toolNamed(tools, 'list_delayed_orders');
});

await check('both tools have a useful description (the model picks tools by reading these)', () => {
  for (const name of ['get_order_status', 'list_delayed_orders']) {
    const d = toolNamed(tools, name).description ?? '';
    expect(d.trim().split(/\s+/).length >= 6, `${name}: "${d}". Say what it does and what it returns`);
  }
});

await check('get_order_status takes a required string orderId, with a description', () => {
  const s = toolNamed(tools, 'get_order_status').inputSchema ?? {};
  expect(s.properties?.orderId?.type === 'string', 'inputSchema: { orderId: z.string() }');
  expect(s.required?.includes('orderId'), 'orderId must be required');
  expect(s.properties.orderId.description, 'describe the parameter: z.string().describe("...")');
});

await check('list_delayed_orders takes an optional string carrier', () => {
  const s = toolNamed(tools, 'list_delayed_orders').inputSchema ?? {};
  expect(s.properties?.carrier?.type === 'string', 'inputSchema: { carrier: z.string().optional() }');
  expect(!s.required?.includes('carrier'), 'carrier must be optional');
});

await check('both tools are annotated read-only (readOnlyHint: true)', () => {
  for (const name of ['get_order_status', 'list_delayed_orders']) {
    expect(toolNamed(tools, name).annotations?.readOnlyHint === true, `${name}: add annotations: { readOnlyHint: true }`);
  }
});

await check('get_order_status("BW-1002") returns that order as JSON text', async () => {
  const r = await call('get_order_status', { orderId: 'BW-1002' });
  expect(!r.isError, `it returned an error: ${textOf(r)}`);
  expectEqual(jsonOf(r), { id: 'BW-1002', status: 'out_for_delivery', carrier: 'SwiftDrop', eta: '2026-11-18', delayed: false });
});

await check('get_order_status for an unknown order is a tool error (isError) that names the ID', async () => {
  const r = await call('get_order_status', { orderId: 'BW-9999' });
  expect(r.isError === true, 'return { isError: true, content: [...] } so the model knows it failed');
  expect(textOf(r).includes('BW-9999'), `say which order wasn't found (got "${textOf(r)}")`);
});

await check('list_delayed_orders() returns every delayed order ID as a JSON array', async () => {
  const r = await call('list_delayed_orders', {});
  expect(!r.isError, textOf(r));
  expectEqual([...jsonOf(r)].sort(), ['BW-1003', 'BW-1005', 'BW-1006']);
});

await check('list_delayed_orders({ carrier: "Parcelwise" }) filters by carrier', async () => {
  const r = await call('list_delayed_orders', { carrier: 'Parcelwise' });
  expectEqual([...jsonOf(r)].sort(), ['BW-1003', 'BW-1006']);
});

await check('stdout carries only MCP messages (log with console.error, not console.log)', () => {
  expect(!mcp.protocolErrors.length, mcp.protocolErrors[0]);
});

await mcp.client.close();
