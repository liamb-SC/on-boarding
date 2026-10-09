// Helpers shared by the backend-apis track's check.mjs validators.
import http from 'node:http';

// Listen on a free local port. Accepts an Express app (or any request
// handler) or an http.Server. Returns { url, server, close }.
export async function listen(appOrServer) {
  const server = appOrServer instanceof http.Server ? appOrServer : http.createServer(appOrServer);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    server,
    close: () => new Promise((resolve) => {
      server.closeAllConnections?.();
      server.close(() => resolve());
    }),
  };
}

// A tiny cookie jar: remembers name=value pairs from Set-Cookie headers and
// sends them back on the next request, like a browser would (minus the rules).
export function cookieJar() {
  const jar = new Map();
  return {
    jar,
    get: (name) => jar.get(name),
    set: (name, value) => jar.set(name, value),
    header: () => [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
    store(res) {
      for (const line of res.headers.getSetCookie?.() ?? []) {
        const [pair] = line.split(';');
        const i = pair.indexOf('=');
        const name = pair.slice(0, i).trim();
        const value = pair.slice(i + 1).trim();
        // An expired / emptied cookie means "delete it".
        if (!value || /expires=Thu, 01 Jan 1970/i.test(line)) jar.delete(name);
        else jar.set(name, value);
      }
    },
  };
}

// fetch that never follows redirects and parses JSON bodies when it can.
export async function request(url, { jar, json, headers = {}, ...opts } = {}) {
  const h = { ...headers };
  if (jar && jar.jar.size) h.cookie = jar.header();
  if (json !== undefined) {
    h['content-type'] = 'application/json';
    opts.body = JSON.stringify(json);
  }
  const res = await fetch(url, { redirect: 'manual', ...opts, headers: h });
  jar?.store(res);
  const text = await res.text();
  let body = text;
  try { body = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, headers: res.headers, body, text };
}
