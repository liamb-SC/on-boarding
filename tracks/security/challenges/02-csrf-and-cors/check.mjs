import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { client, expectStatus, listen, parseSetCookie } from '../../security-checks.mjs';

watchdog();

let server;
const started = await check('app.js exports createApp() and the app starts', async () => {
  const { createApp } = await fromSandbox('./app.js');
  server = await listen(createApp());
});
if (!started) process.exit(1);

const json = (body) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const balance = async (c) => (await (await c.request('/balance')).json()).balance;

// ----- the session cookie ---------------------------------------------------
const alice = client(server.url);
const login = await alice.request('/login', json({ username: 'alice' }));
const sid = login.headers.getSetCookie().map(parseSetCookie).find((c) => c.name === 'sid');

await check('logging in sets the sid session cookie', () => expect(sid, `no sid cookie (status ${login.status})`));
await check('the session cookie is HttpOnly (XSS can\'t read it)', () => expect(sid?.attrs.httponly, 'add httpOnly: true'));
await check('the session cookie is SameSite=Lax or Strict', () =>
  expect(/^(lax|strict)$/i.test(sid?.attrs.samesite ?? ''), `SameSite is "${sid?.attrs.samesite ?? 'not set'}"`));

// ----- CSRF tokens -------------------------------------------------------------
let token;
await check('GET /csrf-token returns a random token (at least 32 hex chars)', async () => {
  token = (await (await alice.request('/csrf-token')).json()).csrfToken;
  expect(/^[0-9a-f]{32,}$/i.test(token ?? ''), `got ${JSON.stringify(token)}`);
});
await check('the token stays the same for the whole session', async () => {
  const again = (await (await alice.request('/csrf-token')).json()).csrfToken;
  expect(token && again === token, 'a second GET /csrf-token returned a different token');
});

await check('POST /transfer with no token -> 403 and no money moves', async () => {
  expectStatus(await alice.request('/transfer', json({ to: 'mallory', amount: 50 })), 403);
  expect((await balance(alice)) === 100, 'the balance changed anyway');
});
await check('POST /transfer with a wrong token -> 403', async () => {
  const res = await alice.request('/transfer', {
    ...json({ to: 'mallory', amount: 50 }),
    headers: { 'content-type': 'application/json', 'x-csrf-token': 'f'.repeat(64) },
  });
  expectStatus(res, 403);
});

const bob = client(server.url);
await bob.request('/login', json({ username: 'bob' }));
const bobToken = (await (await bob.request('/csrf-token')).json()).csrfToken;
await check('each session gets its own token', () => expect(bobToken && bobToken !== token, 'alice and bob got the same token'));
await check('a token from another session is rejected (403)', async () => {
  const res = await alice.request('/transfer', {
    ...json({ to: 'mallory', amount: 50 }),
    headers: { 'content-type': 'application/json', 'x-csrf-token': bobToken },
  });
  expectStatus(res, 403);
});

await check('POST /transfer with the X-CSRF-Token header works', async () => {
  const res = await alice.request('/transfer', {
    ...json({ to: 'bob', amount: 10 }),
    headers: { 'content-type': 'application/json', 'x-csrf-token': token },
  });
  expectStatus(res, 200);
  expect((await balance(alice)) === 90, 'balance should now be 90');
});
await check('an HTML form can send the token as a _csrf field', async () => {
  const res = await alice.request('/transfer', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ to: 'bob', amount: '5', _csrf: token }),
  });
  expectStatus(res, 200);
});
await check('csrf.js compares tokens with timingSafeEqual', () => {
  const src = readFileSync(path.join(SANDBOX, 'csrf.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  expect(/timingSafeEqual\s*\(/.test(src), 'a plain === leaks timing; use crypto.timingSafeEqual');
});

// ----- CORS ----------------------------------------------------------------------
const from = (origin, init = {}) => fetch(`${server.url}/balance`, { ...init, headers: { origin, ...init.headers } });

await check('an allowed origin gets Access-Control-Allow-Origin echoed + credentials', async () => {
  for (const origin of ['https://app.example.com', 'http://localhost:5173']) {
    const res = await from(origin);
    expect(res.headers.get('access-control-allow-origin') === origin, `${origin} got ACAO ${res.headers.get('access-control-allow-origin')}`);
    expect(res.headers.get('access-control-allow-credentials') === 'true', 'missing Access-Control-Allow-Credentials: true');
  }
});
await check('responses Vary on Origin (so caches don\'t mix origins up)', async () => {
  const vary = (await from('https://app.example.com')).headers.get('vary') ?? '';
  expect(/origin/i.test(vary), `Vary: ${vary}`);
});
await check('https://evil.example gets no Access-Control-Allow-Origin', async () => {
  const res = await from('https://evil.example');
  expect(!res.headers.has('access-control-allow-origin'), `got ACAO ${res.headers.get('access-control-allow-origin')}`);
});
await check('...and look-alikes are refused too (https://app.example.com.evil.example)', async () => {
  const res = await from('https://app.example.com.evil.example');
  expect(!res.headers.has('access-control-allow-origin'), 'use an exact match, not startsWith/includes');
});
await check('a disallowed origin still gets a normal response, not a 500 (the browser enforces CORS)', async () => {
  const res = await from('https://evil.example');
  expect(res.status < 500, `got HTTP ${res.status}: call back with (null, false), don't throw`);
});
await check('requests with no Origin header (curl, same-origin) still work', async () => {
  const res = await fetch(`${server.url}/login`, json({ username: 'carol' }));
  expectStatus(res, 200);
});
await check('preflight from an allowed origin: 204 allowing POST and X-CSRF-Token', async () => {
  const res = await from('https://app.example.com', {
    method: 'OPTIONS',
    headers: { 'access-control-request-method': 'POST', 'access-control-request-headers': 'content-type,x-csrf-token' },
  });
  expect(res.status === 204 || res.status === 200, `preflight returned ${res.status}`);
  const methods = res.headers.get('access-control-allow-methods') ?? '';
  const headers = res.headers.get('access-control-allow-headers') ?? '';
  expect(/post/i.test(methods), `Access-Control-Allow-Methods: ${methods}`);
  expect(/x-csrf-token/i.test(headers), `Access-Control-Allow-Headers: ${headers}`);
});
await check('preflight from a disallowed origin is not approved', async () => {
  const res = await from('https://evil.example', {
    method: 'OPTIONS',
    headers: { 'access-control-request-method': 'POST', 'access-control-request-headers': 'x-csrf-token' },
  });
  expect(!res.headers.has('access-control-allow-origin'), 'the preflight approved evil.example');
});

await server.close();
