import { check, expect, fromSandbox, stage, watchdog } from '../../../../lib/checks.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

watchdog();
const ref = stage(path.join(path.dirname(fileURLToPath(import.meta.url)), 'starter'), 'gateway');
const { createService } = await fromSandbox(`${ref}/services.js`);
const { createGateway } = await fromSandbox('./gateway.js');

const listen = (server) => new Promise((r) => server.listen(0, '127.0.0.1', () => r(`http://127.0.0.1:${server.address().port}`)));
const servers = [];
const start = async (server) => { servers.push(server); return listen(server); };

const users = await start(createService('users'));
const orders = await start(createService('orders'));
const dead = 'http://127.0.0.1:1'; // nothing listens on port 1
const clock = { t: 1_000_000 };
const gw = await start(createGateway({
  routes: { '/users': users, '/orders': orders, '/legacy': dead },
  apiKeys: { 'key-alice': 'alice', 'key-bob': 'bob', 'key-carol': 'carol', 'key-dave': 'dave' },
  rateLimit: { limit: 3, windowMs: 1000 },
  now: () => clock.t,
}));

const call = (p, key, init = {}) => fetch(gw + p, { ...init, headers: { ...(key ? { 'x-api-key': key } : {}), ...init.headers } });
const json = async (res) => { try { return await res.json(); } catch { return {}; } };

await check('401 without an API key, or with an unknown one', async () => {
  const a = await call('/users/1');
  const b = await call('/users/1', 'key-mallory');
  expect(a.status === 401 && b.status === 401, `got ${a.status} and ${b.status}`);
});

await check('routes /users/* to the users service and /orders/* to the orders service', async () => {
  const u = await json(await call('/users/42', 'key-alice'));
  const o = await json(await call('/orders/7?expand=items', 'key-bob'));
  expect(u.service === 'users' && u.path === '/users/42', `/users/42 -> ${JSON.stringify(u).slice(0, 120)}`);
  expect(o.service === 'orders' && o.path === '/orders/7?expand=items', `/orders/7 -> ${JSON.stringify(o).slice(0, 120)}`);
});

await check('404 for a path no route matches', async () => {
  const res = await call('/payments/1', 'key-carol');
  expect(res.status === 404, `got ${res.status}`);
});

await check('forwards method and body (POST)', async () => {
  const r = await json(await call('/orders', 'key-dave', { method: 'POST', body: '{"sku":"MUG-1"}', headers: { 'content-type': 'application/json' } }));
  expect(r.method === 'POST' && r.body === '{"sku":"MUG-1"}', `service saw ${r.method} ${r.body}`);
});

clock.t += 10_000; // fresh rate-limit windows for everyone

await check('adds x-user and strips x-api-key before forwarding', async () => {
  const r = await json(await call('/users/1', 'key-alice'));
  expect(r.headers?.['x-user'] === 'alice', `x-user = ${r.headers?.['x-user']}`);
  expect(!r.headers?.['x-api-key'], 'the API key leaked to the backend service');
});

await check('adds an x-request-id, and keeps the client\'s if it sent one', async () => {
  const a = await json(await call('/users/1', 'key-bob'));
  const b = await json(await call('/users/1', 'key-bob', { headers: { 'x-request-id': 'trace-123' } }));
  expect(a.headers?.['x-request-id'], 'no x-request-id was added');
  expect(b.headers?.['x-request-id'] === 'trace-123', `x-request-id = ${b.headers?.['x-request-id']}`);
});

clock.t += 10_000;

await check('rate limit: the 4th request in a window gets 429 with Retry-After', async () => {
  const statuses = [];
  let last;
  for (let i = 0; i < 4; i += 1) { last = await call('/users/1', 'key-carol'); statuses.push(last.status); }
  expect(statuses.join() === '200,200,200,429', `statuses: ${statuses}`);
  const ra = Number(last.headers.get('retry-after'));
  expect(ra === 1, `Retry-After: ${last.headers.get('retry-after')} (seconds until the window resets; here 1)`);
});

await check('rate limit: counted per key (another key is unaffected)', async () => {
  const res = await call('/users/1', 'key-dave');
  expect(res.status === 200, `got ${res.status}`);
});

await check('rate limit: requests are allowed again in the next window', async () => {
  clock.t += 1000;
  const res = await call('/users/1', 'key-carol');
  expect(res.status === 200, `got ${res.status}`);
});

await check('rate limit: is checked before forwarding (requests that failed upstream still count)', async () => {
  clock.t += 10_000;
  for (let i = 0; i < 3; i += 1) await call('/legacy/x', 'key-bob');
  const res = await call('/users/1', 'key-bob');
  expect(res.status === 429, `got ${res.status}`);
});

await check('502 when the service behind a route is unreachable', async () => {
  clock.t += 10_000;
  const res = await call('/legacy/x', 'key-alice');
  expect(res.status === 502, `got ${res.status}`);
});

servers.forEach((s) => s.close());
