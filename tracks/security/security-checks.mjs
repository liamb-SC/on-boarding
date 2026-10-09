// Helpers shared by the security track's check.mjs validators.
import { expect } from '../../lib/checks.mjs';

// listen(app) — start an Express app (or any (req, res) handler) on a free
// local port. Returns { url, close }.
export async function listen(app) {
  const { createServer } = await import('node:http');
  const server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    url,
    close: () => new Promise((resolve) => { server.closeAllConnections?.(); server.close(() => resolve()); }),
  };
}

// A tiny cookie jar: keeps name=value pairs from Set-Cookie and sends them back,
// like a browser would for one site. Redirects are never followed, so the
// checks can look at each Location header.
export function client(base) {
  const jar = new Map();
  async function request(path, init = {}) {
    const headers = new Headers(init.headers);
    if (jar.size && !headers.has('cookie')) {
      headers.set('cookie', [...jar].map(([k, v]) => `${k}=${v}`).join('; '));
    }
    const res = await fetch(new URL(path, base), { redirect: 'manual', ...init, headers });
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(';');
      const i = pair.indexOf('=');
      jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
    }
    return res;
  }
  return { request, jar };
}

// Parse one Set-Cookie line into { name, value, attrs } (attribute names lower-cased).
export function parseSetCookie(line) {
  const [pair, ...rest] = line.split(';').map((s) => s.trim());
  const i = pair.indexOf('=');
  const attrs = {};
  for (const a of rest) {
    const j = a.indexOf('=');
    if (j === -1) attrs[a.toLowerCase()] = true;
    else attrs[a.slice(0, j).toLowerCase()] = a.slice(j + 1);
  }
  return { name: pair.slice(0, i), value: pair.slice(i + 1), attrs };
}

export function expectStatus(res, status, what = '') {
  expect(res.status === status, `${what}expected HTTP ${status}, got ${res.status}`);
}
