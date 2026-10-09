import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, SANDBOX } from '../../../../lib/checks.mjs';
import { run } from '../../mutants.mjs';

const read = (f) => (existsSync(path.join(SANDBOX, f)) ? readFileSync(path.join(SANDBOX, f), 'utf8') : '');

// ----- Part 1: reading shop-session.har ----------------------------------
let answers = {};
await check('answers.json is valid JSON', () => { answers = JSON.parse(read('answers.json')); });

// Accept "/api/x", a full URL, or either with a query string.
const pathOf = (v) => {
  const s = String(v ?? '').trim();
  try { return new URL(s, 'https://x').pathname.replace(/\/+$/, '') || '/'; } catch { return s; }
};
const same = (key, want, norm = (v) => v) => () => {
  expect(answers[key] !== null && answers[key] !== undefined && answers[key] !== '', 'not answered yet');
  expect(norm(answers[key]) === want, `${JSON.stringify(answers[key])} is not right`);
};

await check('requestCount: how many requests the page made', same('requestCount', 8, Number));
await check('slowestPath: the request that took longest', same('slowestPath', '/api/search', pathOf));
await check('slowestWaitMs: how long it waited for the server (timings.wait)', same('slowestWaitMs', 1790, Number));
await check('failedPath: the request the server failed (5xx)', same('failedPath', '/api/recommendations', pathOf));
await check('largestPath: the biggest response body', same('largestPath', '/static/app.js', pathOf));
await check('cookieName: the session cookie set at login', same('cookieName', 'sid', (v) => String(v).trim().toLowerCase().split('=')[0]));
await check('leaks: every place the HAR exposes a credential', () => {
  const got = [...new Set((answers.leaks ?? []).map((v) => String(v).trim().toLowerCase()))].sort();
  expect(got.length, 'not answered yet');
  const want = ['request-body', 'request-header', 'response-body', 'response-header'];
  const missing = want.filter((w) => !got.includes(w));
  const extra = got.filter((g) => !want.includes(g));
  expect(!missing.length && !extra.length,
    `${missing.length ? `you missed ${missing.length}` : ''}${missing.length && extra.length ? ', ' : ''}${extra.length ? `${extra.join(', ')} is wrong` : ''}`);
});

// ----- Part 2: record and sanitise ---------------------------------------
let har;
await check('sanitised.har is a HAR file (log.version, log.entries)', () => {
  const text = read('sanitised.har');
  expect(text, 'no sanitised.har yet');
  har = JSON.parse(text);
  expect(har.log?.version && Array.isArray(har.log.entries), 'expected { "log": { "version": ..., "entries": [...] } }');
});

const entries = har?.log?.entries ?? [];
const entry = (method, p) => entries.find((e) => e.request?.method === method && pathOf(e.request.url) === p);

await check('it is a real recording of this app (x-request-id values the API sent)', () => {
  const served = new Set(read('.git/served-ids').split('\n').filter(Boolean));
  expect(served.size, 'the API has not served anything yet: run `npm start` and open http://localhost:5055/app');
  const ids = entries.flatMap((e) => e.response?.headers ?? [])
    .filter((x) => x.name?.toLowerCase() === 'x-request-id').map((x) => x.value);
  expect(ids.some((id) => served.has(id)), 'no response in it came from your `npm start` server');
});

await check('it still has the app\'s requests, with URLs and statuses (POST /login, GET /notes)', () => {
  expect(entry('POST', '/login')?.response?.status === 200, 'no POST /login with status 200');
  expect(entry('GET', '/notes')?.response?.status === 200, 'no GET /notes with status 200');
});

const text = JSON.stringify(har ?? {});
await check('no bearer token left anywhere (headers, query strings, response bodies)', () => {
  expect(har, 'no sanitised.har yet');
  const found = text.match(/sk_test_[0-9a-f]{16}/g) ?? [];
  expect(!found.length, `${found.length} token(s) still in the file`);
});
await check('no session cookie value left (Cookie / Set-Cookie)', () => {
  expect(har, 'no sanitised.har yet');
  expect(!/sess_[0-9a-f]{16}/.test(text), 'a sid=sess_... value is still in the file');
});
await check('no password left (the login request body)', () => {
  expect(har, 'no sanitised.har yet');
  const body = entry('POST', '/login')?.request?.postData?.text ?? '';
  expect(!body.includes('hunter2'), 'the POST /login body still has "hunter2" in it');
});

await check('the raw recording can\'t be committed by accident (*.har ignored, except sanitised.har)', async () => {
  const raw = await run('git', ['check-ignore', '-q', 'recorded.har']);
  const clean = await run('git', ['check-ignore', '-q', 'sanitised.har']);
  expect(raw.code === 0, 'recorded.har is not ignored: add a rule to .gitignore');
  expect(clean.code !== 0, 'sanitised.har is ignored too: it is safe to share, so let git see it (!sanitised.har)');
});
