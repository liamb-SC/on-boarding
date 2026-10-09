// The price service. Run several of these and they share the database, but
// with CACHE=local each one has its own private cache. Don't edit this file.
//   GET /price/<sku>          -> { sku, price, from: 'cache' | 'db' }   (cache-aside)
//   PUT /price/<sku> {price}  -> writes the db, then invalidates the cache key
import http from 'node:http';
import { db } from './db.js';
import { createLocalCache } from './local-cache.js';
import { createSharedCache } from './shared-cache.js';

const cache = process.env.CACHE === 'shared' ? createSharedCache() : createLocalCache();

const server = http.createServer(async (req, res) => {
  const sku = decodeURIComponent(req.url.replace(/^\/price\//, ''));
  const send = (status, body) => res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body));
  try {
    if (req.method === 'GET') {
      const cached = await cache.get(`price:${sku}`);
      if (cached !== undefined && cached !== null) return send(200, { sku, price: cached, from: 'cache' });
      const price = await db.getPrice(sku);
      await cache.set(`price:${sku}`, price);
      return send(200, { sku, price, from: 'db' });
    }
    if (req.method === 'PUT') {
      let body = '';
      for await (const chunk of req) body += chunk;
      await db.setPrice(sku, JSON.parse(body).price);
      await cache.del(`price:${sku}`);
      return send(200, { ok: true });
    }
    send(405, { error: 'method not allowed' });
  } catch (err) {
    send(500, { error: err.message });
  }
});
server.listen(Number(process.env.PORT ?? 0), '127.0.0.1', () => {
  console.log(`price service (${process.env.CACHE ?? 'local'} cache) listening on ${server.address().port}`);
});
