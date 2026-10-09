import { check, expect, fromSandbox, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const { createServer } = await fromSandbox('./server.js');

// Start a server on a free port; returns a fetch bound to it.
async function serve(opts) {
  const server = createServer(opts);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = (p, headers = {}) => fetch(base + p, { headers });
  return { get, close: () => server.close() };
}

// Parse "public, max-age=60, s-maxage=0" into { public: true, 'max-age': '60', ... }
const directives = (res) => Object.fromEntries(
  (res.headers.get('cache-control') ?? '').split(',').map((d) => d.trim().toLowerCase()).filter(Boolean)
    .map((d) => { const [k, v] = d.split('='); return [k, v ?? true]; }));

const app = await serve();

await check('/assets/app.3f9a1c.js: public, max-age=31536000 (one year), immutable', async () => {
  const cc = directives(await app.get('/assets/app.3f9a1c.js'));
  expect(cc.public && cc['max-age'] === '31536000' && cc.immutable, `Cache-Control: ${JSON.stringify(cc)}`);
});

await check('/: no-cache (cache it, but revalidate every time) with an ETag', async () => {
  const res = await app.get('/');
  const cc = directives(res);
  expect(cc['no-cache'] && !cc['no-store'], `Cache-Control: ${JSON.stringify(cc)}`);
  expect(res.headers.get('etag'), 'no ETag header');
});

await check('/api/products: browsers revalidate (max-age=0) but the CDN keeps it 60s (s-maxage=60)', async () => {
  const cc = directives(await app.get('/api/products'));
  expect(cc.public && cc['max-age'] === '0' && cc['s-maxage'] === '60', `Cache-Control: ${JSON.stringify(cc)}`);
});

let etag;
await check('/api/products: has a quoted ETag', async () => {
  etag = (await app.get('/api/products')).headers.get('etag');
  expect(etag && /^(W\/)?".+"$/.test(etag), `ETag: ${etag} (an ETag value is in double quotes: "abc123")`);
});

await check('/api/products: If-None-Match with the current ETag gets 304 and an empty body', async () => {
  const res = await app.get('/api/products', { 'if-none-match': etag });
  const body = await res.text();
  expect(res.status === 304, `status ${res.status}`);
  expect(body === '', 'a 304 must not carry a body');
});

await check('/api/products: a stale ETag gets a full 200', async () => {
  const res = await app.get('/api/products', { 'if-none-match': '"stale"' });
  expect(res.status === 200 && (await res.json()).length === 2, `status ${res.status}`);
});

await check('/api/products: the ETag changes when the data changes', async () => {
  const other = await serve({ products: [{ id: 1, name: 'Kettle', price: 35 }] });
  const etag2 = (await other.get('/api/products')).headers.get('etag');
  other.close();
  expect(etag2 && etag2 !== etag, `same ETag "${etag2}" for different content`);
});

await check('/: If-None-Match with its ETag gets 304', async () => {
  const tag = (await app.get('/')).headers.get('etag');
  const res = await app.get('/', { 'if-none-match': tag });
  expect(res.status === 304, `status ${res.status}`);
});

await check('/api/me: private, no-store (never cached by the CDN or the browser)', async () => {
  const cc = directives(await app.get('/api/me'));
  expect(cc.private && cc['no-store'], `Cache-Control: ${JSON.stringify(cc)}`);
  expect(!cc['s-maxage'] && !cc.public, 'personal data must not be cacheable by a shared cache');
});

app.close();
