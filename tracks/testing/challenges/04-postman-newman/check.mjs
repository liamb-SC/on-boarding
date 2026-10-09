import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { startServer } from '../../fixtures/notes-api.mjs';

watchdog(120000);
const { default: newman } = await fromSandbox('newman');

let collection;
await check('collection.json is a valid Postman v2.1 collection', () => {
  collection = JSON.parse(readFileSync(path.join(SANDBOX, 'collection.json'), 'utf8'));
  expect(/v2\.1/.test(collection.info?.schema ?? ''), 'info.schema should be the v2.1 schema URL (export as "Collection v2.1")');
  expect(Array.isArray(collection.item), 'no item[] array');
});

// Every request in the collection, including ones inside folders.
const requests = (items = []) => items.flatMap((i) => (i.item ? requests(i.item) : [i]));
const all = requests(collection?.item);
const rawUrl = (r) => (typeof r.request?.url === 'string' ? r.request.url : r.request?.url?.raw ?? '');

await check('it has at least 5 requests', () => expect(all.length >= 5, `found ${all.length}`));

await check('every request URL starts with {{baseUrl}} (no hard-coded host)', () => {
  const bad = all.filter((r) => !rawUrl(r).startsWith('{{baseUrl}}'));
  expect(!bad.length, `hard-coded: ${bad.map((r) => r.name).join(', ')}`);
});

// Run the collection with newman against a fresh server. `mode` breaks one behaviour.
async function runAgainst(mode) {
  const log = [];
  const server = await startServer({ mode, onRequest: (r) => log.push(r) });
  try {
    const summary = await new Promise((resolve, reject) => newman.run({
      collection,
      envVar: [{ key: 'baseUrl', value: `http://127.0.0.1:${server.port}` }],
      reporters: [],
      timeoutRequest: 5000,
    }, (err, s) => (err ? reject(err) : resolve(s))));
    return { summary, log };
  } finally {
    await server.close();
  }
}

let real;
await check('newman runs the collection against the API with no failures', async () => {
  expect(collection, 'fix collection.json first');
  real = await runAgainst('normal');
  const f = real.summary.run.failures;
  expect(!f.length, `${f.length} failed: ${f.slice(0, 2).map((x) => `${x.source?.name}: ${x.error?.message}`).join(' | ')}`);
});

await check('it makes at least 6 pm.test assertions', () => {
  const n = real?.summary.run.stats.assertions.total ?? 0;
  expect(n >= 6, `found ${n}`);
});

await check('it logs in and creates a note (POST /login, POST /notes)', () => {
  expect(real?.log.some((r) => r.method === 'POST' && r.path === '/login'), 'no POST /login');
  expect(real?.log.some((r) => r.method === 'POST' && r.path === '/notes'), 'no POST /notes');
});

await check('the token from /login is saved and reused (Authorization: Bearer {{token}})', () => {
  const issued = real?.log.some((r) => r.path !== '/login' && /^Bearer sk_test_/.test(r.headers.authorization ?? ''));
  expect(issued, 'no later request sent the token that /login returned (dev-123 does not count)');
});

await check('the new note\'s id is saved and used to fetch it (GET /notes/{{noteId}})', () =>
  // Seed notes are 1 and 2, so anything from 3 up was created during the run.
  expect(real?.log.some((r) => r.method === 'GET' && Number(r.path.match(/^\/notes\/(\d+)$/)?.[1]) >= 3),
    'expected GET /notes/<id of the note you created>'));

await check('one request checks that /notes without a token is rejected (401)', () => {
  const unauth = real?.summary.run.executions.some((e) =>
    e.response?.code === 401 && /\/notes/.test(e.request.url.getPath()) && !e.request.headers.has('Authorization'));
  expect(unauth, 'send GET /notes with no Authorization header and assert the status');
});

// Broken APIs. A useful collection notices every one of them.
const mutants = [
  ['POST /notes answers 200 instead of 201', 'create-200'],
  ['/notes stops requiring a token', 'no-auth'],
  ['/login stops returning a token', 'login-no-token'],
  ['GET /notes/:id returns the wrong title', 'wrong-title'],
];
for (const [desc, mode] of mutants) {
  await check(`your tests catch the bug: ${desc}`, async () => {
    expect(real && !real.summary.run.failures.length, 'make the collection pass against the real API first');
    const { summary } = await runAgainst(mode);
    expect(summary.run.failures.length > 0, 'every test still passed against the broken API');
  });
}
