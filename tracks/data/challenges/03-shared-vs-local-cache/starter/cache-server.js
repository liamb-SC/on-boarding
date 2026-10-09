// A tiny shared key-value cache over HTTP: a stand-in for Redis or Memcached,
// so this challenge runs without Docker. Don't edit this file.
//   GET    /kv/<key>   -> 200 { value } | 404
//   PUT    /kv/<key>   body { value } -> 204
//   DELETE /kv/<key>   -> 204
import http from 'node:http';

const store = new Map();
const server = http.createServer(async (req, res) => {
  const key = decodeURIComponent(req.url.replace(/^\/kv\//, ''));
  if (req.method === 'GET') {
    if (!store.has(key)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ value: store.get(key) }));
  } else if (req.method === 'PUT') {
    let body = '';
    for await (const chunk of req) body += chunk;
    store.set(key, JSON.parse(body).value);
    res.writeHead(204).end();
  } else if (req.method === 'DELETE') {
    store.delete(key);
    res.writeHead(204).end();
  } else {
    res.writeHead(405).end();
  }
});
server.listen(Number(process.env.PORT ?? 6380), '127.0.0.1', () => {
  console.log(`cache listening on ${server.address().port}`);
});
