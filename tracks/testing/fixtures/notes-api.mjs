// A tiny notes API with no dependencies. The Postman, httpie and HAR challenges
// all talk to it:
//   npm start                          # http://localhost:5055
//   curl -s localhost:5055/health
//
// Routes
//   GET    /health                    -> 200 { status: "ok" }
//   POST   /login   {username,password} -> 200 { token } + a `sid` cookie (learner / hunter2)
//   GET    /notes?tag=&limit=         -> 200 [note]          (auth)
//   POST   /notes   {title,tags?,priority?} -> 201 note      (auth, JSON only)
//   GET    /notes/:id                 -> 200 note | 404      (auth)
//   DELETE /notes/:id                 -> 204 | 404           (auth)
//   POST   /feedback  (form or JSON)  -> 201 { received }
//   GET    /app                       -> a small web page that uses the API
//
// Auth is `Authorization: Bearer <token>`: a token from /login, or the dev
// token `dev-123`. Data lives in memory until you stop the server.
//
// Validators import startServer() and can pass `mode` to break one behaviour
// on purpose, to prove a test suite would notice.
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const DEV_TOKEN = 'dev-123';
const hex = (n) => randomBytes(n).toString('hex');

const APP_PAGE = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Notes</title></head>
<body>
  <h1>My notes</h1>
  <ul id="notes"><li>Loading...</li></ul>
  <script>
    (async () => {
      const login = await fetch('/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username: 'learner', password: 'hunter2' }),
      });
      const { token } = await login.json();
      const res = await fetch('/notes', { headers: { authorization: 'Bearer ' + token } });
      const notes = await res.json();
      document.getElementById('notes').innerHTML =
        notes.map((n) => '<li>' + n.title + '</li>').join('');
      // A "helpful" analytics beacon that leaks the token in the query string.
      fetch('/health?access_token=' + token + '&page=notes');
    })();
  </script>
</body>
</html>
`;

export function createApp({ mode = 'normal', onRequest = () => {} } = {}) {
  const tokens = new Set([DEV_TOKEN]);
  let nextId = 3;
  const notes = new Map([
    [1, { id: 1, title: 'Welcome', tags: ['intro'], priority: 1 }],
    [2, { id: 2, title: 'Ship it', tags: ['urgent', 'work'], priority: 3 }],
  ]);

  return async function handle(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const raw = await new Promise((resolve) => {
      let data = '';
      req.on('data', (c) => { data += c; });
      req.on('end', () => resolve(data));
    });
    const type = (req.headers['content-type'] ?? '').split(';')[0].trim();
    let body = null;
    if (raw && type === 'application/json') {
      try { body = JSON.parse(raw); } catch { body = undefined; }
    } else if (raw && type === 'application/x-www-form-urlencoded') {
      body = Object.fromEntries(new URLSearchParams(raw));
    }

    const requestId = `req_${hex(6)}`;
    onRequest({
      method: req.method, path: url.pathname, query: Object.fromEntries(url.searchParams),
      headers: req.headers, contentType: type, raw, body, requestId,
    });

    const send = (status, payload, headers = {}) => {
      const h = { 'x-request-id': requestId, ...headers };
      if (payload === undefined) return res.writeHead(status, h).end();
      if (typeof payload === 'string') return res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', ...h }).end(payload);
      res.writeHead(status, { 'content-type': 'application/json', ...h }).end(JSON.stringify(payload));
    };

    const bearer = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    const authed = tokens.has(bearer) || tokens.has(url.searchParams.get('access_token'))
      || mode === 'no-auth';
    const needAuth = () => send(401, { error: 'missing or invalid bearer token' });

    if (body === undefined) return send(400, { error: 'invalid JSON body' });

    if (req.method === 'GET' && url.pathname === '/health') return send(200, { status: 'ok' });
    if (req.method === 'GET' && (url.pathname === '/app' || url.pathname === '/')) return send(200, APP_PAGE);

    if (req.method === 'POST' && url.pathname === '/login') {
      if (body?.username !== 'learner' || body?.password !== 'hunter2') {
        return send(401, { error: 'wrong username or password' });
      }
      const token = `sk_test_${hex(8)}`;
      tokens.add(token);
      const payload = mode === 'login-no-token' ? { ok: true } : { token };
      return send(200, payload, { 'set-cookie': `sid=sess_${hex(8)}; Path=/; HttpOnly` });
    }

    if (req.method === 'POST' && url.pathname === '/feedback') {
      if (!body) return send(400, { error: 'send a form or JSON body' });
      return send(201, { received: body });
    }

    if (url.pathname === '/notes') {
      if (!authed) return needAuth();
      if (req.method === 'GET') {
        let list = [...notes.values()];
        const tag = url.searchParams.get('tag');
        if (tag) list = list.filter((n) => n.tags.includes(tag));
        const limit = Number(url.searchParams.get('limit'));
        if (limit > 0) list = list.slice(0, limit);
        return send(200, list);
      }
      if (req.method === 'POST') {
        if (type !== 'application/json') return send(415, { error: 'send JSON (content-type: application/json)' });
        if (typeof body?.title !== 'string' || !body.title) return send(400, { error: 'title is required' });
        const note = { id: nextId++, title: body.title, tags: body.tags ?? [], priority: body.priority ?? 1 };
        notes.set(note.id, note);
        return send(mode === 'create-200' ? 200 : 201, note);
      }
    }

    const m = url.pathname.match(/^\/notes\/(\d+)$/);
    if (m) {
      if (!authed) return needAuth();
      const note = notes.get(Number(m[1]));
      if (!note) return send(404, { error: 'note not found' });
      if (req.method === 'GET') {
        return send(200, mode === 'wrong-title' ? { ...note, title: `${note.title} (edited)` } : note);
      }
      if (req.method === 'DELETE') { notes.delete(note.id); return send(204); }
    }

    send(404, { error: 'no such route' });
  };
}

// Start on `port` (0 = any free port). Resolves to { port, close }.
export function startServer(opts = {}) {
  const server = createServer(createApp(opts));
  return new Promise((resolve) => {
    server.listen(opts.port ?? 0, '127.0.0.1', () => resolve({
      port: server.address().port,
      close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }),
    }));
  });
}

// `node notes-api.mjs`: run it for real. ID_LOG=<file> appends every
// x-request-id it sends, so a validator can tell a real recording from a fake.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const port = Number(process.env.PORT ?? 5055);
  const log = process.env.ID_LOG;
  const server = createServer(createApp({
    onRequest: (r) => {
      console.log(`${r.method} ${r.path}${Object.keys(r.query).length ? `?${new URLSearchParams(r.query)}` : ''}`);
      if (log) appendFileSync(log, `${r.requestId}\n`);
    },
  }));
  server.listen(port, () => console.log(`Notes API on http://localhost:${port}  (web page: /app)`));
}
