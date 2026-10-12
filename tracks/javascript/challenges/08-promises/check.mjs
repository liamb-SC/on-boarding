import { cpSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
// A broken retry leaves floating promises behind. Don't let them crash the run.
process.on('unhandledRejection', () => {});
const STARTER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'starter');

// Grade against the original services.js, whatever happened to the sandbox copy.
cpSync(path.join(STARTER, 'services.js'), path.join(SANDBOX, 'services.js'));
const { flaky, mirror, TimeoutError } = await fromSandbox('./services.js');
const p = await fromSandbox('./promises.js');

const settle = (promise) => promise.then((value) => ({ value }), (error) => ({ error }));
const timers = () => process.getActiveResourcesInfo().filter((r) => r === 'Timeout').length;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// readConfigAsync
await check('readConfigAsync("db") resolves to the config', async () => {
  expectEqual(await p.readConfigAsync('db'), { host: 'localhost', pool: 5 });
});

await check('readConfigAsync rejects with the callback\'s error for an unknown name', async () => {
  const r = await settle(p.readConfigAsync('nope'));
  expect(r.error, `it resolved with ${JSON.stringify(r.value)}; call reject(err) when the callback gets an error`);
  expect(r.error.message === 'no config named "nope"', `rejected with "${r.error.message}"`);
});

// retry
await check('retry resolves with the first success (fails twice, 3 attempts)', async () => {
  const r = await settle(p.retry(flaky(2), 3));
  expect(!r.error, `rejected with "${r.error?.message}"`);
  expect(r.value === 'ok on attempt 3', `resolved with ${JSON.stringify(r.value)}; return the retry from .catch so the chain waits for it`);
});

await check('retry does not call fn again after a success', async () => {
  let calls = 0;
  const fn = () => { calls += 1; return Promise.resolve('first'); };
  expectEqual(await p.retry(fn, 3), 'first');
  expect(calls === 1, `fn was called ${calls} times`);
});

await check('retry rejects with the LAST error once attempts run out', async () => {
  const r = await settle(p.retry(flaky(5), 2));
  expect(r.error, `it resolved with ${JSON.stringify(r.value)}`);
  expect(r.error.message === 'attempt 2 failed', `rejected with "${r.error.message}", expected "attempt 2 failed"`);
});

await check('retry waits delayMs between attempts', async () => {
  const stamps = [];
  const inner = flaky(2);
  const fn = () => { stamps.push(Date.now()); return inner(); };
  await settle(p.retry(fn, 3, 40));
  expect(stamps.length === 3, `fn was called ${stamps.length} times, expected 3`);
  const gaps = stamps.slice(1).map((s, i) => s - stamps[i]);
  expect(gaps.every((g) => g >= 35), `gaps between calls were ${gaps.join('ms, ')}ms, expected about 40ms each`);
});

// withTimeout
await check('withTimeout resolves with the value of a fast promise', async () => {
  expectEqual(await p.withTimeout(Promise.resolve(42), 1000), 42);
});

await check('withTimeout passes through a fast rejection unchanged', async () => {
  const boom = new Error('boom');
  const r = await settle(p.withTimeout(Promise.reject(boom), 1000));
  expect(r.error === boom, r.error ? `rejected with "${r.error.message}"` : 'it resolved');
});

await check('withTimeout rejects with a TimeoutError when the promise is too slow', async () => {
  const r = await settle(p.withTimeout(mirror('slow', 200)('a.zip'), 20));
  expect(r.error instanceof TimeoutError, r.error ? `rejected with ${r.error.name}` : `resolved with ${JSON.stringify(r.value)}`);
});

await check('withTimeout clears its timer once the promise settles', async () => {
  await sleep(250); // let earlier checks' timers finish
  const before = timers();
  await p.withTimeout(Promise.resolve('ok'), 5000);
  await settle(p.withTimeout(Promise.reject(new Error('x')), 5000));
  const left = timers() - before;
  expect(left <= 0, `${left} timer(s) still running; they'd keep Node alive for 5s (hint: clearTimeout in .finally)`);
});

// firstAvailable
await check('firstAvailable skips a fast broken mirror and resolves with the first success', async () => {
  const r = await settle(p.firstAvailable([mirror('eu', 5, false), mirror('us', 30), mirror('asia', 60)], 'a.zip'));
  expect(!r.error, `rejected with "${r.error?.message}"; race settles with the first one to finish, even a failure`);
  expectEqual(r.value, 'a.zip from us');
});

await check('firstAvailable rejects with an AggregateError when every mirror fails', async () => {
  const r = await settle(p.firstAvailable([mirror('eu', 5, false), mirror('us', 10, false)], 'a.zip'));
  expect(r.error instanceof AggregateError, r.error ? `rejected with ${r.error.name}` : 'it resolved');
  expect(r.error.errors?.length === 2, `AggregateError has ${r.error.errors?.length} errors, expected 2`);
});
