// Two tiny backend services. Each one echoes what it received, so you can see
// exactly what the gateway forwarded. Don't edit this file.
import http from 'node:http';

export function createService(name) {
  return http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ service: name, method: req.method, path: req.url, headers: req.headers, body }));
  });
}
