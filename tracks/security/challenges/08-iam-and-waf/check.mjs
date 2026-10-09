import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { listen } from '../../security-checks.mjs';

watchdog();

// ----- IAM: a tiny static policy evaluator ----------------------------------------
// Enough of the real rules for this exercise: explicit Deny wins, then any
// matching Allow, else implicit deny. Wildcards * and ?. Actions match
// case-insensitively, resources case-sensitively. Conditions: StringEquals,
// StringLike (a missing context key never matches).
const list = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const glob = (pattern, value, flags = '') =>
  new RegExp(`^${pattern.split('').map((c) => (c === '*' ? '.*' : c === '?' ? '.' : c.replace(/[.+^${}()|[\]\\]/g, '\\$&'))).join('')}$`, flags).test(value);
const conditionOk = (cond = {}, ctx) => Object.entries(cond).every(([op, kv]) => Object.entries(kv).every(([k, want]) => {
  if (!(k in ctx)) return false;
  if (op === 'StringEquals') return list(want).includes(ctx[k]);
  if (op === 'StringLike') return list(want).some((w) => glob(w, ctx[k]));
  throw new Error(`the checker doesn't support condition operator ${op}: use StringLike or StringEquals`);
}));
const statements = (p) => list(p.Statement);
const matches = (s, action, resource, ctx) =>
  list(s.Action).some((a) => glob(a, action, 'i')) && list(s.Resource).some((r) => glob(r, resource)) && conditionOk(s.Condition, ctx);
function allowed(policy, action, resource, ctx = {}) {
  const hit = (effect) => statements(policy).some((s) => s.Effect === effect && matches(s, action, resource, ctx));
  return !hit('Deny') && hit('Allow');
}

const B = 'arn:aws:s3:::acme-reports';
let policy;
await check('iam/policy.json is valid JSON with Version 2012-10-17', () => {
  policy = JSON.parse(readFileSync(path.join(SANDBOX, 'iam/policy.json'), 'utf8'));
  expect(policy.Version === '2012-10-17', `Version is ${policy.Version}`);
  expect(statements(policy).length, 'no Statement');
});
if (policy) {
  await check('no wildcard actions (no "*", "s3:*" or "s3:Get*")', () => {
    for (const s of statements(policy)) for (const a of list(s.Action)) expect(!a.includes('*'), `Action "${a}"`);
  });
  await check('no "Resource": "*"', () => {
    for (const s of statements(policy)) for (const r of list(s.Resource)) expect(r !== '*' && r !== 'arn:aws:s3:::*', `Resource "${r}"`);
  });
  await check('no NotAction / NotResource (they grant everything else)', () =>
    expect(statements(policy).every((s) => !s.NotAction && !s.NotResource), 'found NotAction or NotResource'));
  await check('every statement has a Sid saying what it\'s for', () =>
    expect(statements(policy).every((s) => typeof s.Sid === 'string' && s.Sid.length > 2), 'add a Sid to each statement'));

  const can = [
    ['s3:PutObject', `${B}/uploads/2026/q3.csv`, {}, 'upload to uploads/'],
    ['s3:GetObject', `${B}/uploads/q3.csv`, {}, 'read back from uploads/'],
    ['s3:ListBucket', B, { 's3:prefix': 'uploads/' }, 'list uploads/'],
    ['s3:ListBucket', B, { 's3:prefix': 'uploads/2026/' }, 'list uploads/2026/'],
  ];
  const cannot = [
    ['s3:DeleteObject', `${B}/uploads/q3.csv`, {}, 'delete uploads'],
    ['s3:GetObject', `${B}/finance/salaries.csv`, {}, 'read finance/'],
    ['s3:PutObject', `${B}/index.html`, {}, 'write outside uploads/'],
    ['s3:PutObject', 'arn:aws:s3:::acme-reports-backup/uploads/x.csv', {}, 'write to the acme-reports-backup bucket'],
    ['s3:GetObject', 'arn:aws:s3:::other-bucket/uploads/x.csv', {}, 'read another bucket'],
    ['s3:ListBucket', B, { 's3:prefix': 'finance/' }, 'list finance/'],
    ['s3:ListBucket', B, {}, 'list the whole bucket (no prefix)'],
    ['s3:PutBucketPolicy', B, {}, 'change the bucket policy'],
    ['s3:DeleteBucket', B, {}, 'delete the bucket'],
    ['iam:CreateUser', 'arn:aws:iam::123456789012:user/mallory', {}, 'create IAM users'],
  ];
  for (const [action, resource, ctx, what] of can) {
    await check(`ALLOWS: ${what} (${action})`, () => expect(allowed(policy, action, resource, ctx), `${action} on ${resource} ${JSON.stringify(ctx)} is denied`));
  }
  for (const [action, resource, ctx, what] of cannot) {
    await check(`DENIES: ${what}`, () => expect(!allowed(policy, action, resource, ctx), `${action} on ${resource} ${JSON.stringify(ctx)} is allowed`));
  }
}

// ----- WAF rules --------------------------------------------------------------------
let server;
const started = await check('app.js exports createApp() and the app starts', async () => {
  const { createApp } = await fromSandbox('./app.js');
  server = await listen(createApp());
});
if (started) {
  const get = async (p) => {
    const res = await fetch(server.url + p);
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
  const blocked = (desc, p, rule) => check(`WAF blocks ${desc} (403, rule "${rule}")`, async () => {
    const r = await get(p);
    expect(r.status === 403 && r.body.error === 'blocked' && r.body.rule === rule, `got ${r.status} ${JSON.stringify(r.body)}`);
  });
  const passes = (desc, p) => check(`WAF lets through ${desc}`, async () => {
    const r = await get(p);
    expect(r.status === 200, `got ${r.status} ${JSON.stringify(r.body)}: a false positive`);
  });
  const q = (s) => encodeURIComponent(s);
  await blocked("' OR 1=1 --", `/search?q=${q("' OR 1=1 --")}`, 'sqli');
  await blocked('UNION SELECT', `/search?q=${q('1 UNION SELECT password FROM users')}`, 'sqli');
  await blocked('; DROP TABLE', `/search?q=${q('x; DROP TABLE users')}`, 'sqli');
  await blocked('../ in a query value', `/files?name=${q('../../etc/passwd')}`, 'path-traversal');
  await blocked('an encoded ..%2F in the path', '/files/..%2F..%2Fetc%2Fpasswd', 'path-traversal');
  await blocked('<script> in a query value', `/search?q=${q('<script>alert(1)</script>')}`, 'xss');
  await passes("O'Brien", `/search?q=${q("O'Brien")}`);
  await passes('"select a plan"', `/search?q=${q('select a plan')}`);
  await passes('a normal file name', `/files/${q('q3-report.v2.pdf')}`);
  await check('app.js rate-limits: about 100 requests a minute, then 429', async () => {
    let first429 = 0;
    for (let i = 1; i <= 110 && !first429; i++) if ((await fetch(`${server.url}/search?q=x`)).status === 429) first429 = i;
    // 9 requests were already made above, so the limit kicks in around request 92.
    expect(first429 > 80, first429 ? `throttled after only ${first429} requests` : 'no 429 after 110 more requests');
  });
  await server.close();
}

// ----- rate limiter -------------------------------------------------------------------
const { createRateLimiter } = await fromSandbox('./waf.js');
const { default: express } = await fromSandbox('express');
let t = 1_000_000;
const limited = express();
limited.use(createRateLimiter({ limit: 3, windowMs: 60_000, now: () => t, key: (req) => req.get('x-client') }));
limited.get('/', (req, res) => res.json({ ok: true }));
const rl = await listen(limited);
const hit = (client) => fetch(rl.url, { headers: { 'x-client': client } });

await check('rate limiter: the first 3 requests in a window pass', async () => {
  for (let i = 1; i <= 3; i++) {
    const r = await hit('a');
    expect(r.status === 200, `request ${i} got ${r.status}`);
  }
});
t += 10_000;
await check('rate limiter: the 4th gets 429', async () => {
  const r = await hit('a');
  expect(r.status === 429, `got ${r.status}`);
});
await check('rate limiter: Retry-After is the seconds left in the window (50)', async () => {
  const r = await hit('a');
  expect(r.headers.get('retry-after') === '50', `Retry-After: ${r.headers.get('retry-after')}`);
});
await check('rate limiter: other clients have their own budget', async () => {
  const r = await hit('b');
  expect(r.status === 200, `got ${r.status}`);
});
t += 50_001;
await check('rate limiter: once the window has passed, requests pass again', async () => {
  const r = await hit('a');
  expect(r.status === 200, `got ${r.status}`);
});
await rl.close();
