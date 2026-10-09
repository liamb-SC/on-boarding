import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { run, tail } from '../../mutants.mjs';
import { startServer } from '../../fixtures/notes-api.mjs';

watchdog(60000);
const read = (f) => (existsSync(path.join(SANDBOX, f)) ? readFileSync(path.join(SANDBOX, f), 'utf8') : '');
const script = read('commands.sh');
const code = script.replace(/^\s*#.*$/gm, '');

await check('httpie is installed (`http --version`)', async () => {
  const r = await run('http', ['--version']).catch(() => ({ code: 1 }));
  expect(r.code === 0, 'install it: pipx install httpie (or pip install --user httpie)');
});

await check('commands.sh uses httpie, not curl or wget', () => {
  expect(!/\b(curl|wget)\b/.test(code), 'use http, not curl/wget');
  expect((code.match(/^\s*https?\s/gm) ?? []).length >= 5, 'expected 5 http commands, one per line');
});

// Run the learner's script against a fresh API and record what reached it.
const log = [];
const server = await startServer({ onRequest: (r) => log.push(r) });
let result;
await check('commands.sh runs without errors', async () => {
  result = await run('bash', ['commands.sh'], { env: { BASE: `127.0.0.1:${server.port}` }, timeout: 30000 });
  expect(result.code === 0, tail(result.out, 3));
});
await server.close();

const find = (method, p) => log.find((r) => r.method === method && r.path === p);
const authed = (r) => r?.headers.authorization === 'Bearer dev-123';

await check('every request was sent by httpie (User-Agent: HTTPie/...)', () => {
  expect(log.length, 'no requests reached the API');
  expect(log.every((r) => /^HTTPie\//.test(r.headers['user-agent'] ?? '')), 'some requests came from another client');
});

await check('2: GET /notes with ?tag=urgent&limit=5 and the bearer token', () => {
  const r = log.find((x) => x.method === 'GET' && x.path === '/notes');
  expect(r, 'no GET /notes');
  expectEqual(r.query, { tag: 'urgent', limit: '5' }, 'query: ');
  expect(authed(r), 'send Authorization: Bearer dev-123 (e.g. -A bearer -a "$TOKEN")');
});

await check('3: POST /notes sends JSON with title "Buy milk"', () => {
  const r = find('POST', '/notes');
  expect(r, 'no POST /notes');
  expect(r.contentType === 'application/json', `content-type was ${r.contentType || 'missing'}`);
  expect(r.body?.title === 'Buy milk', `title was ${JSON.stringify(r.body?.title)}`);
});

await check('3: priority is the NUMBER 2 and tags is the array ["home","urgent"] (raw JSON with :=)', () => {
  const r = find('POST', '/notes');
  expect(r, 'no POST /notes');
  expect(r.body?.priority === 2, `priority was ${JSON.stringify(r?.body?.priority)} (priority=2 sends a string; use :=)`);
  expectEqual(r.body?.tags, ['home', 'urgent'], 'tags: ');
});

await check('3: it sends the token and an X-Request-Id: onboard-1 header', () => {
  const r = find('POST', '/notes');
  expect(r, 'no POST /notes');
  expect(authed(r), 'no Authorization: Bearer dev-123');
  expect(r.headers['x-request-id'] === 'onboard-1', `X-Request-Id was ${JSON.stringify(r.headers['x-request-id'])}`);
});

await check('4: POST /feedback is a form (rating=5 and a comment), not JSON', () => {
  const r = find('POST', '/feedback');
  expect(r, 'no POST /feedback');
  expect(r.contentType === 'application/x-www-form-urlencoded', `content-type was ${r.contentType || 'missing'} (try --form)`);
  expect(r.body?.rating === '5' && r.body?.comment, `fields were ${JSON.stringify(r.body)}`);
});

await check('5: DELETE /notes/1 with the token', () => {
  const r = find('DELETE', '/notes/1');
  expect(r, 'no DELETE /notes/1');
  expect(authed(r), 'no Authorization: Bearer dev-123');
});

await check('outputs/create.txt shows the full exchange for task 3 (http -v)', () => {
  const out = read('outputs/create.txt');
  expect(out, 'save it with: http -v ... > outputs/create.txt');
  expect(/^POST \/notes HTTP\/1\.1/m.test(out), 'no "POST /notes HTTP/1.1" request line: use -v to print the request too');
  expect(/"priority":\s*2\b/.test(out), 'the request body with "priority": 2 is missing');
  expect(/^HTTP\/1\.1 201 Created/m.test(out), 'no "HTTP/1.1 201 Created" response line');
});
