import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const { percentile, withTimeout, hedged } = await fromSandbox('./latency.js');
const { createBackend } = await fromSandbox('./backend.js');
const timed = async (p) => { const t = performance.now(); const v = await p.then((x) => ({ x }), (e) => ({ e })); return { ...v, ms: performance.now() - t }; };

// ---- percentiles ----------------------------------------------------------
await check('percentile: nearest rank on 1..100 (p50 = 50, p95 = 95, p99 = 99, p100 = 100)', () => {
  const xs = Array.from({ length: 100 }, (_, i) => i + 1);
  expectEqual([50, 95, 99, 100].map((p) => percentile(xs, p)), [50, 95, 99, 100]);
});

await check('percentile: sorts numerically and leaves the input alone', () => {
  const xs = [100, 3, 25, 7, 1000, 12, 9, 40, 2, 5];
  const copy = [...xs];
  expectEqual([percentile(xs, 50), percentile(xs, 90), percentile(xs, 10)], [9, 100, 2]);
  expectEqual(xs, copy, 'input was modified: ');
});

await check('percentile: the tail is invisible in the median (p50 vs p99 of a long-tail sample)', () => {
  const xs = [...Array(98).fill(10), 900, 1000];
  expect(percentile(xs, 50) === 10 && percentile(xs, 99) === 900, `p50 ${percentile(xs, 50)}, p99 ${percentile(xs, 99)}`);
});

// ---- timeouts -------------------------------------------------------------
await check('withTimeout: returns the result when fn is fast enough', async () => {
  const svc = createBackend([10]);
  const r = await withTimeout((signal) => svc.call(signal), 100);
  expect(r?.latencyMs === 10, `got ${JSON.stringify(r)}`);
});

await check('withTimeout: rejects with code ETIMEDOUT at the deadline (not when fn finally finishes)', async () => {
  const svc = createBackend([500]);
  const { e, ms } = await timed(withTimeout((signal) => svc.call(signal), 50));
  expect(e?.code === 'ETIMEDOUT', `got ${e ? `error ${e.code ?? e.message}` : 'a result'}`);
  expect(ms < 200, `took ${Math.round(ms)}ms`);
});

await check('withTimeout: aborts the slow call (cancellation, not just giving up)', async () => {
  const svc = createBackend([500]);
  await withTimeout((signal) => svc.call(signal), 30).catch(() => {});
  expect(svc.cancelled === 1, 'the backend call was left running; abort the signal on timeout');
});

await check('withTimeout: passes through fn\'s own error', async () => {
  const svc = createBackend([-1]);
  const { e } = await timed(withTimeout((signal) => svc.call(signal), 100));
  expect(e?.message === 'backend error', `got ${e?.code ?? e?.message ?? 'a result'}`);
});

// ---- hedging --------------------------------------------------------------
await check('hedged: a fast first call means no hedge is sent', async () => {
  const svc = createBackend([10]);
  await hedged((signal) => svc.call(signal), { hedgeAfterMs: 50 });
  await new Promise((r) => setTimeout(r, 60));
  expect(svc.calls === 1, `${svc.calls} calls were made`);
});

await check('hedged: a slow first call is hedged, and the fast hedge wins', async () => {
  const svc = createBackend([400, 10]);
  const { x, ms } = await timed(hedged((signal) => svc.call(signal), { hedgeAfterMs: 30 }));
  expect(x?.latencyMs === 10, `got ${JSON.stringify(x)}`);
  expect(ms < 150, `took ${Math.round(ms)}ms; it should be about 30 + 10`);
  expect(svc.calls === 2, `${svc.calls} calls`);
});

await check('hedged: the losing call is aborted', async () => {
  const svc = createBackend([400, 10]);
  await hedged((signal) => svc.call(signal), { hedgeAfterMs: 30 });
  expect(svc.cancelled === 1, `${svc.cancelled} calls were cancelled`);
});

await check('hedged: if the hedge fails, the original can still win', async () => {
  const svc = createBackend([80, -1]);
  const { x } = await timed(hedged((signal) => svc.call(signal), { hedgeAfterMs: 20 }));
  expect(x?.latencyMs === 80, `got ${JSON.stringify(x)}`);
});

await check('hedged: rejects only when every attempt fails', async () => {
  const svc = createBackend([-1]);
  const { e } = await timed(hedged((signal) => svc.call(signal), { hedgeAfterMs: 5 }));
  expect(e, 'it resolved although every call failed');
});

// ---- answers ----------------------------------------------------------------
let answers = {};
try { answers = JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8')); } catch {}
for (const [key, want, tol] of [
  ['percent-of-requests-slow-when-fanning-out-to-10-backends-each-1pct-slow', 9.56, 0.05],
  ['max-ms-left-for-the-db-call-if-the-request-budget-is-300ms-and-auth-took-120ms-and-50ms-must-be-kept-for-rendering', 130, 0],
]) {
  await check(`answers.json: ${key.split('-').slice(0, 6).join(' ')}...`, () => {
    const got = Number(answers[key]);
    expect(answers[key] !== null && Number.isFinite(got), 'fill in a number');
    expect(Math.abs(got - want) <= tol, `${got} is not right yet`);
  });
}
