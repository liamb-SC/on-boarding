import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const { retry } = await fromSandbox('./retry.js');
const { createPaymentHandler } = await fromSandbox('./payments.js');

// ---- nines -------------------------------------------------------------------
let nines = {};
try { nines = JSON.parse(readFileSync(path.join(SANDBOX, 'nines.json'), 'utf8')); } catch {}
const NINES = [
  ['downtime-hours-per-year-at-99.9', 8.76, 0.01],
  ['downtime-minutes-per-month-at-99.99', 4.32, 0.01],
  ['availability-percent-of-3-serial-deps-each-99.9', 99.7003, 0.005],
  ['availability-percent-of-2-redundant-instances-each-99', 99.99, 0.0005],
];
for (const [key, want, tol] of NINES) {
  await check(`nines.json: ${key}`, () => {
    const got = Number(nines[key]);
    expect(nines[key] !== null && nines[key] !== '' && Number.isFinite(got), 'fill in a number');
    expect(Math.abs(got - want) <= tol, `${got} is not right yet`);
  });
}

// ---- retry ---------------------------------------------------------------------
const failing = (n, value = 'ok') => {
  const f = async () => { f.calls += 1; if (f.calls <= n) throw new Error(`fail ${f.calls}`); return value; };
  f.calls = 0;
  return f;
};
const recorder = () => { const s = async (ms) => { s.waits.push(ms); }; s.waits = []; return s; };

await check('retry: returns the value once fn succeeds (2 failures, then success)', async () => {
  const fn = failing(2);
  const sleep = recorder();
  expect(await retry(fn, { retries: 3, sleep }) === 'ok', 'wrong value');
  expect(fn.calls === 3, `fn was called ${fn.calls} times`);
});

await check('retry: gives up after retries + 1 attempts and rethrows the last error', async () => {
  const fn = failing(99);
  const err = await retry(fn, { retries: 3, sleep: recorder() }).then(() => null, (e) => e);
  expect(fn.calls === 4, `fn was called ${fn.calls} times`);
  expect(err?.message === 'fail 4', `rethrew ${err?.message}`);
});

await check('retry: exponential backoff, 100, 200, 400 (with random() = 1)', async () => {
  const sleep = recorder();
  await retry(failing(99), { retries: 3, baseMs: 100, capMs: 10_000, sleep, random: () => 1 }).catch(() => {});
  expectEqual(sleep.waits, [100, 200, 400]);
});

await check('retry: the delay is capped at capMs', async () => {
  const sleep = recorder();
  await retry(failing(99), { retries: 5, baseMs: 100, capMs: 300, sleep, random: () => 1 }).catch(() => {});
  expectEqual(sleep.waits, [100, 200, 300, 300, 300]);
});

await check('retry: full jitter, delay = random() × backoff', async () => {
  const sleep = recorder();
  await retry(failing(99), { retries: 3, baseMs: 100, capMs: 10_000, sleep, random: () => 0.25 }).catch(() => {});
  expectEqual(sleep.waits, [25, 50, 100]);
});

await check('retry: non-retryable errors (e.g. 400 Bad Request) are thrown immediately', async () => {
  const fn = failing(99);
  const sleep = recorder();
  await retry(fn, { retries: 3, sleep, isRetryable: () => false }).catch(() => {});
  expect(fn.calls === 1 && sleep.waits.length === 0, `fn was called ${fn.calls} times`);
});

// ---- idempotency -------------------------------------------------------------
const processor = (latency = 5) => {
  const p = {
    charges: [],
    failNext: false,
    async charge(amount) {
      await new Promise((r) => setTimeout(r, latency));
      if (p.failNext) { p.failNext = false; throw new Error('card network timeout'); }
      const result = { chargeId: `ch_${p.charges.length + 1}`, amount };
      p.charges.push(result);
      return result;
    },
  };
  return p;
};
const errCode = (promise) => promise.then(() => 'no error', (e) => e?.code ?? e?.message);

await check('idempotency: a missing key is rejected (MISSING_KEY)', async () => {
  const p = processor();
  expect(await errCode(createPaymentHandler(p).charge({ amount: 5 })) === 'MISSING_KEY', 'expected error.code MISSING_KEY');
  expect(p.charges.length === 0, 'charged without a key');
});

await check('idempotency: retrying with the same key returns the first result and charges once', async () => {
  const p = processor();
  const pay = createPaymentHandler(p);
  const a = await pay.charge({ idempotencyKey: 'k1', amount: 500 });
  const b = await pay.charge({ idempotencyKey: 'k1', amount: 500 });
  expectEqual(b, a);
  expect(p.charges.length === 1, `the card was charged ${p.charges.length} times`);
});

await check('idempotency: different keys are different charges', async () => {
  const p = processor();
  const pay = createPaymentHandler(p);
  await pay.charge({ idempotencyKey: 'k1', amount: 500 });
  await pay.charge({ idempotencyKey: 'k2', amount: 500 });
  expect(p.charges.length === 2, `${p.charges.length} charges`);
});

await check('idempotency: concurrent duplicates (same key, in flight) charge once', async () => {
  const p = processor(30);
  const pay = createPaymentHandler(p);
  const results = await Promise.all([1, 2, 3].map(() => pay.charge({ idempotencyKey: 'k1', amount: 500 })));
  expect(p.charges.length === 1, `the card was charged ${p.charges.length} times`);
  expect(results.every((r) => r?.chargeId === results[0].chargeId), 'callers got different results');
});

await check('idempotency: reusing a key with a different amount is rejected (KEY_REUSED)', async () => {
  const p = processor();
  const pay = createPaymentHandler(p);
  await pay.charge({ idempotencyKey: 'k1', amount: 500 });
  expect(await errCode(pay.charge({ idempotencyKey: 'k1', amount: 900 })) === 'KEY_REUSED', 'expected error.code KEY_REUSED');
  expect(p.charges.length === 1, 'charged again');
});

await check('idempotency: a failed charge does not use up the key', async () => {
  const p = processor();
  const pay = createPaymentHandler(p);
  p.failNext = true;
  await pay.charge({ idempotencyKey: 'k1', amount: 500 }).catch(() => {});
  const r = await pay.charge({ idempotencyKey: 'k1', amount: 500 });
  expect(r?.chargeId && p.charges.length === 1, 'the retry after a failure should go through');
});

await check('together: retry + idempotency key = exactly one charge despite a lost response', async () => {
  const p = processor();
  const pay = createPaymentHandler(p);
  let first = true;
  // The charge succeeds, but the response is "lost" the first time, so the client retries with the same key.
  const client = async () => { const r = await pay.charge({ idempotencyKey: 'order-7', amount: 250 }); if (first) { first = false; throw new Error('socket hang up'); } return r; };
  const r = await retry(client, { retries: 3, sleep: async () => {} });
  expect(r?.amount === 250 && p.charges.length === 1, `charges: ${p.charges.length}`);
});
