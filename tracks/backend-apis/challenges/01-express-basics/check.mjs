import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';
import { listen, request } from '../../http-checks.mjs';

watchdog();
let api;
const started = await check('app.js exports createApp() and the app starts', async () => {
  const { createApp } = await fromSandbox('./app.js');
  api = await listen(createApp());
});
if (!started) process.exit(1);
const get = (p, o) => request(api.url + p, o);

await check('every response has an X-Request-Id header (middleware)', async () => {
  const a = await get('/health');
  const b = await get('/health');
  expect(a.headers.get('x-request-id'), 'GET /health has no X-Request-Id header');
  expect(a.headers.get('x-request-id') !== b.headers.get('x-request-id'), 'two requests got the same id');
});
await check('an incoming X-Request-Id is reused, not replaced', async () => {
  const r = await get('/health', { headers: { 'x-request-id': 'trace-abc-123' } });
  expectEqual(r.headers.get('x-request-id'), 'trace-abc-123', 'X-Request-Id: ');
});
await check('GET /notes lists the notes (router mounted at /notes)', async () => {
  const r = await get('/notes');
  expectEqual(r.status, 200, 'status: ');
  expect(Array.isArray(r.body) && r.body.length === 2, `expected the 2 seed notes, got ${r.text.slice(0, 80)}`);
});
await check('GET /notes/2 returns that note', async () => {
  const r = await get('/notes/2');
  expectEqual([r.status, r.body], [200, { id: 2, text: 'Read the Express docs' }]);
});
await check('GET /notes/999 is a 404 with a JSON error', async () => {
  const r = await get('/notes/999');
  expectEqual(r.status, 404, 'status: ');
  expect(typeof r.body?.error === 'string', `expected { "error": "..." }, got ${r.text.slice(0, 80)}`);
});
await check('POST /notes creates a note: 201, the note, and a Location header', async () => {
  const r = await get('/notes', { method: 'POST', json: { text: 'Ship it' } });
  expectEqual(r.status, 201, 'status: ');
  expect(r.body?.text === 'Ship it' && Number.isInteger(r.body?.id), `unexpected body ${r.text.slice(0, 80)}`);
  expectEqual(r.headers.get('location'), `/notes/${r.body.id}`, 'Location: ');
  const again = await get(`/notes/${r.body.id}`);
  expectEqual(again.status, 200, 'the new note can be fetched: ');
});
await check('POST /notes validates text (missing, non-string, blank -> 400)', async () => {
  for (const json of [{}, { text: 42 }, { text: '   ' }]) {
    const r = await get('/notes', { method: 'POST', json });
    expect(r.status === 400, `${JSON.stringify(json)} got ${r.status}, expected 400`);
    expect(typeof r.body?.error === 'string', `${JSON.stringify(json)}: expected a JSON { "error" } body`);
  }
});
await check('an unknown route is a JSON 404 { "error": "Not Found" }', async () => {
  const r = await get('/nope');
  expectEqual([r.status, r.body], [404, { error: 'Not Found' }]);
});
await check('malformed JSON is a 400 from the error handler (not a 500 or an HTML page)', async () => {
  const r = await get('/notes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"text": oops' });
  expectEqual(r.status, 400, 'status: ');
  expect(typeof r.body?.error === 'string', `expected a JSON error body, got ${r.text.slice(0, 80)}`);
});
await check('a thrown error is a JSON 500 that leaks nothing', async () => {
  const errors = console.error;
  console.error = () => {}; // keep the learner's server-side logging out of the report
  const r = await get('/boom').finally(() => { console.error = errors; });
  expectEqual([r.status, r.body], [500, { error: 'Internal Server Error' }]);
  expect(!r.text.includes('hunter2'), 'the error message reached the client');
});

await api.close();
