import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX } from '../../../../lib/checks.mjs';
import { generateLog } from '../../fixtures/latency.mjs';

const { parseLine, percentile } = await fromSandbox('./percentiles.js');

// Reference implementation, used for the hidden test cases and the answers.
const ref = (values, p) => [...values].sort((a, b) => a - b)[Math.ceil((p / 100) * values.length) - 1];

await check('parseLine turns a log line into { method, path, status, ms } with numbers', () =>
  expectEqual(parseLine('2026-10-01T12:00:03.112Z POST /api/checkout 201 2875ms'),
    { method: 'POST', path: '/api/checkout', status: 201, ms: 2875 }));
await check('parseLine returns null for comments and blank lines', () => {
  expect(parseLine('# access log: <timestamp> ...') === null, 'a comment line should give null');
  expect(parseLine('') === null, 'a blank line should give null');
});
await check('percentile: 1..10 gives p50=5, p90=9, p99=10, p100=10', () => {
  const v = [7, 3, 10, 1, 9, 2, 8, 5, 4, 6];
  expectEqual([50, 90, 99, 100].map((p) => percentile(v, p)), [5, 9, 10, 10]);
});
await check('percentile sorts numerically, not as strings', () =>
  expectEqual(percentile([5, 40, 300, 1000, 9], 40), 9, '[5, 40, 300, 1000, 9] p40: '));
await check('percentile does not modify the array it is given', () => {
  const v = [3, 1, 2];
  percentile(v, 50);
  expectEqual(v, [3, 1, 2]);
});
await check('percentile matches the nearest-rank method on 200 random arrays', () => {
  let seed = 7;
  const rand = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  for (let i = 0; i < 200; i++) {
    const v = Array.from({ length: 1 + Math.floor(rand() * 300) }, () => Math.round(rand() * 5000));
    for (const p of [1, 50, 95, 99, 99.9]) {
      const got = percentile(v, p);
      expect(got === ref(v, p), `n=${v.length}, p${p}: expected ${ref(v, p)}, got ${got}`);
    }
  }
});

// The expected numbers come from a fresh copy of the log, not the sandbox one.
const groups = {};
for (const line of generateLog().split('\n')) {
  const m = line.match(/^\S+ (\S+) (\S+) \d+ (\d+)ms$/);
  if (m) (groups[`${m[1]} ${m[2]}`] ??= []).push(Number(m[3]));
}
const mean = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const co = groups['POST /api/checkout'];
let answers = {};
await check('answers.json is valid JSON', () => {
  answers = JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8'));
});
const a = answers.checkout ?? {};
await check('checkout: mean (to within 0.5ms)', () =>
  expect(Math.abs(Number(a.mean) - mean(co)) <= 0.5, `got ${a.mean}. Run npm run report once your functions work`));
for (const p of [50, 95, 99]) {
  await check(`checkout: p${p}`, () => expect(Number(a[`p${p}`]) === ref(co, p), `got ${a[`p${p}`]}`));
}
const worst = (f) => Object.entries(groups).sort(([, x], [, y]) => f(y) - f(x))[0][0];
const sameEndpoint = (got, want) => String(got ?? '').includes(want.split(' ')[1]);
await check('worst_mean: the endpoint with the highest mean', () =>
  expect(sameEndpoint(answers.worst_mean, worst(mean)), `got "${answers.worst_mean}"`));
await check('worst_p99: the endpoint with the highest p99', () =>
  expect(sameEndpoint(answers.worst_p99, worst((v) => ref(v, 99))), `got "${answers.worst_p99}"`));

const letter = (k) => createHash('sha256').update(`p99:${k}:${String(answers[k] ?? '').trim().toLowerCase()}`).digest('hex').slice(0, 12);
await check('q_averages: why checkout\'s mean is misleading', () => expect(letter('q_averages') === 'ef5d0478aa6e', 'not quite. Compare its p50, p95 and p99'));
await check('q_fanout: one page, 10 calls', () => expect(letter('q_fanout') === '8ce032a133b2', 'not quite. P(all 10 under p99) = 0.99^10'));
