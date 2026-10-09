import { spawnSync } from 'node:child_process';
import { cpSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const STARTER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'starter');

// Grade against the original api.js, whatever happened to the sandbox copy.
cpSync(path.join(STARTER, 'api.js'), path.join(SANDBOX, 'api.js'));
const api = await fromSandbox('./api.js');
const dash = await fromSandbox('./dashboard.js');
const reset = () => Object.assign(api.calls, { inFlight: 0, maxInFlight: 0, total: 0 });

await check('loadDashboard(1) returns the user and their orders', async () => {
  reset();
  expectEqual(await dash.loadDashboard(1), { user: { id: 1, name: 'Ada' }, orders: ['mug', 'tee'] });
});

await check('loadDashboard runs getUser and getOrders in parallel (Promise.all)', async () => {
  reset();
  await dash.loadDashboard(3);
  expect(api.calls.maxInFlight === 2, `at most ${api.calls.maxInFlight} call(s) were in flight at once; start both before awaiting`);
});

await check('loadDashboard still rejects with NotFoundError for an unknown user', async () => {
  const err = await dash.loadDashboard(99).then(() => null, (e) => e);
  expect(err instanceof api.NotFoundError, err ? `rejected with ${err.name}` : 'it resolved instead of rejecting');
});

await check('loadMany reports each id as ok or failed, in order', async () => {
  reset();
  expectEqual(await dash.loadMany([1, 99, 2, -1]), [
    { id: 1, ok: true, user: { id: 1, name: 'Ada' } },
    { id: 99, ok: false, error: 'user 99 not found' },
    { id: 2, ok: true, user: { id: 2, name: 'Linus' } },
    { id: -1, ok: false, error: 'database unavailable' },
  ]);
});

await check('loadMany fetches all users in parallel', async () => {
  reset();
  await dash.loadMany([1, 2, 3, 99, 1]);
  expect(api.calls.maxInFlight === 5, `only ${api.calls.maxInFlight} call(s) in flight at once, expected 5`);
});

await check('safeLoad returns the user when it exists', async () => {
  expectEqual(await dash.safeLoad(2), { id: 2, name: 'Linus' });
});

await check('safeLoad returns null for a user that does not exist', async () => {
  const r = await dash.safeLoad(99).then((v) => ({ v }), (e) => ({ e }));
  expect(!r.e, `it rejected with "${r.e?.message}": the try/catch never saw the rejection (hint: return await)`);
  expectEqual(r.v, null);
});

await check('safeLoad lets other errors through (database unavailable)', async () => {
  const err = await dash.safeLoad(-1).then(() => null, (e) => e);
  expect(err?.message === 'database unavailable', err ? `rejected with "${err.message}"` : 'it swallowed the error; only NotFoundError means "null"');
});

await check('event-loop.answer.txt matches what event-loop.cjs really prints', () => {
  const real = spawnSync(process.execPath, [path.join(STARTER, 'event-loop.cjs')], { encoding: 'utf8' }).stdout.split(/\s+/).filter(Boolean);
  const answer = readFileSync(path.join(SANDBOX, 'event-loop.answer.txt'), 'utf8')
    .split('\n').filter((l) => !l.trim().startsWith('#')).join(' ')
    .split(/[\s,]+/).map((s) => s.toUpperCase()).filter(Boolean);
  expect(answer.length === real.length, `expected ${real.length} letters, found ${answer.length}`);
  const firstWrong = answer.findIndex((l, i) => l !== real[i]);
  expect(firstWrong === -1, `position ${firstWrong + 1} is wrong. Run it, then work out why`);
});
