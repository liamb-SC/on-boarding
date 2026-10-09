// The registry over HTTP, so you can play with it using curl. Don't edit this file.
//   POST   /services/<name>              { "id": "...", "url": "..." }  register
//   PUT    /services/<name>/<id>         heartbeat (404 = unknown, please re-register)
//   DELETE /services/<name>/<id>         deregister
//   GET    /services/<name>              live instances
import http from 'node:http';
import { createRegistry } from './registry.js';

const registry = createRegistry({ ttlMs: 15_000 });

http.createServer(async (req, res) => {
  const [, , name, id] = req.url.split('/');
  const send = (status, body) => res.writeHead(status, { 'content-type': 'application/json' }).end(JSON.stringify(body ?? {}));
  if (!req.url.startsWith('/services/') || !name) return send(404, { error: 'try /services/<name>' });
  if (req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    registry.register(name, JSON.parse(body || '{}'));
    return send(201);
  }
  if (req.method === 'PUT') return registry.heartbeat(name, id) ? send(200) : send(404, { error: 'unknown instance' });
  if (req.method === 'DELETE') { registry.deregister(name, id); return send(204); }
  if (req.method === 'GET') return send(200, registry.lookup(name));
  send(405);
}).listen(8500, () => console.log('registry listening on http://localhost:8500 (instances expire after 15s)'));
