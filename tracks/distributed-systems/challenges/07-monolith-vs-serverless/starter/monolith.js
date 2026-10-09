// The shop: one deployable that does everything. Receipt rendering and sending
// happen inside the checkout request.
import http from 'node:http';
import { sendMail } from './lib/mailer.js';

const orders = new Map();

export function renderReceipt(order) {
  const lines = order.items.map((i) => `${i.qty} x ${i.name} @ £${i.price.toFixed(2)}`);
  const total = order.items.reduce((sum, i) => sum + i.qty * i.price, 0);
  return [`Receipt for order ${order.id}`, ...lines, `Total: £${total.toFixed(2)}`].join('\n');
}

export function createApp() {
  return http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/orders') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const order = JSON.parse(body);
      orders.set(order.id, order);
      await sendMail(order.email, `Your receipt for ${order.id}`, renderReceipt(order));
      res.writeHead(201, { 'content-type': 'application/json' }).end(JSON.stringify({ id: order.id }));
      return;
    }
    res.writeHead(404).end();
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createApp().listen(3000, () => console.log('shop on http://localhost:3000'));
}
