import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';

watchdog(30000);
const { startServer, TOKEN } = await import(path.resolve(fileURLToPath(import.meta.url), '../../../fixtures/api-server.mjs'));
const api = await startServer(0);
const c = await fromSandbox('./client.js');
const caught = (p) => p.then((v) => { throw new Error(`it resolved with ${JSON.stringify(v)}`); }, (e) => e);

let client;
await check('createClient returns an axios instance with baseURL and a 1000ms timeout', () => {
  client = c.createClient({ baseURL: api.url, token: TOKEN });
  expect(typeof client?.get === 'function' && client.defaults, 'return axios.create({ ... })');
  expectEqual(client.defaults.baseURL, api.url, 'baseURL: ');
  expectEqual(client.defaults.timeout, 1000, 'timeout: ');
});

await check('the token is added by a request interceptor', async () => {
  expect(client.interceptors.request.handlers.filter(Boolean).length > 0, 'no request interceptor: use client.interceptors.request.use(...)');
  const other = c.createClient({ baseURL: api.url, token: 'token-B' });
  api.requests.length = 0;
  await other.get('/books').catch(() => {});
  expectEqual(api.requests[0]?.headers.authorization, 'Bearer token-B', 'Authorization header sent: ');
});

await check('a response interceptor unwraps the body: client.get(\'/books\') resolves to the array', async () => {
  expect(client.interceptors.response.handlers.filter(Boolean).length > 0, 'no response interceptor: use client.interceptors.response.use(...)');
  const books = await client.get('/books');
  expect(Array.isArray(books), `got ${JSON.stringify(books)?.slice(0, 60)}`);
  expectEqual(books.length, 3);
});

await check('getBook(client, "2") returns the book, through the client', async () => {
  api.requests.length = 0;
  expectEqual(await c.getBook(client, '2'), { id: '2', title: 'Kindred', author: 'Octavia E. Butler' });
  expectEqual(api.requests.map((r) => r.path), ['/books/2'], 'requests the server saw: ');
});

await check('getBook returns null for a 404', async () => {
  expectEqual(await c.getBook(client, '99'), null);
});

await check('getBook still rejects on other errors (401 with a bad token)', async () => {
  const err = await caught(c.getBook(c.createClient({ baseURL: api.url, token: 'wrong' }), '1'));
  expectEqual(err?.response?.status, 401, 'expected the 401 axios error, got status ');
});

await check('describeError: an error status -> "http <status>"', async () => {
  const err = await caught(c.createClient({ baseURL: api.url, token: 'wrong' }).get('/books'));
  expectEqual(c.describeError(err), 'http 401');
  expectEqual(c.describeError(await caught(client.get('/nope'))), 'http 404');
});

await check('describeError: hitting the 1000ms timeout -> "timeout"', async () => {
  expectEqual(c.describeError(await caught(client.get('/slow'))), 'timeout');
});

await check('describeError: nothing listening -> "network"', async () => {
  const closed = await startServer(0);
  await closed.close();
  expectEqual(c.describeError(await caught(c.createClient({ baseURL: closed.url, token: TOKEN }).get('/books'))), 'network');
});

await check('describeError: a non-axios error -> "unknown"', () => {
  expectEqual(c.describeError(new TypeError('x is undefined')), 'unknown');
});

await api.close();
