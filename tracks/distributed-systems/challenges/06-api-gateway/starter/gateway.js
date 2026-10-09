// The API gateway: the single entry point in front of the services.
import http from 'node:http';
import { randomUUID } from 'node:crypto';

// routes:    { '/users': 'http://127.0.0.1:4001', '/orders': 'http://127.0.0.1:4002' }
// apiKeys:   { 'key-alice': 'alice' }  (API key -> user)
// rateLimit: { limit, windowMs }       per API key, fixed window
// now:       the clock (use it instead of Date.now(), so tests can control time)
export function createGateway({ routes, apiKeys, rateLimit = { limit: 5, windowMs: 1000 }, now = Date.now }) {
  return http.createServer(async (req, res) => {
    // TODO, in this order:
    // 1. Auth: the x-api-key header must be a known key            -> else 401
    // 2. Rate limit: at most `limit` requests per key per window   -> else 429 + Retry-After (seconds)
    // 3. Route: find the route whose prefix matches req.url        -> else 404
    // 4. Forward with forward(): add x-user (the key's user) and x-request-id
    //    (keep the client's if it sent one, else randomUUID()), and DON'T pass
    //    the x-api-key on to the service.
    //                                                               -> 502 if the service is unreachable
    sendJson(res, 501, { error: 'not implemented' });
  });
}

// Helpers. You shouldn't need to change these.
export function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

// Forward req to `${target}${req.url}` with the given headers, and stream the
// answer back to res. Throws if the target is unreachable.
export async function forward(req, res, target, headers) {
  let body;
  if (!['GET', 'HEAD'].includes(req.method)) {
    body = '';
    for await (const chunk of req) body += chunk;
  }
  const upstream = await fetch(target + req.url, { method: req.method, headers, body });
  res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/json' });
  res.end(Buffer.from(await upstream.arrayBuffer()));
}
