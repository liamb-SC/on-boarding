// The Brightwell orders MCP server (stdio). It refuses to start without an API
// token in ORDERS_API_TOKEN, like most real servers that front an internal API.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { orders } from '../orders.js';

if (!process.env.ORDERS_API_TOKEN) {
  console.error('orders-server: ORDERS_API_TOKEN is not set. Refusing to start.');
  process.exit(1);
}

const server = new McpServer({ name: 'orders', version: '1.0.0' });
const json = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value) }] });

server.registerTool('get_order_status', {
  description: 'Look up one Brightwell order by ID and return its status, carrier, ETA and whether it is delayed.',
  inputSchema: { orderId: z.string().describe('Order ID, e.g. BW-1002') },
  annotations: { readOnlyHint: true },
}, async ({ orderId }) => {
  const order = orders.find((o) => o.id === orderId);
  if (!order) return { isError: true, content: [{ type: 'text', text: `Order ${orderId} not found` }] };
  return json(order);
});

server.registerTool('list_delayed_orders', {
  description: 'List the IDs of delayed orders, optionally only for one carrier.',
  inputSchema: { carrier: z.string().optional().describe('Carrier name, e.g. SwiftDrop') },
  annotations: { readOnlyHint: true },
}, async ({ carrier }) => json(orders.filter((o) => o.delayed && (!carrier || o.carrier === carrier)).map((o) => o.id)));

await server.connect(new StdioServerTransport());
