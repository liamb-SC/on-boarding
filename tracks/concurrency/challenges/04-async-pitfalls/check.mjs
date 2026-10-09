import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';
import { within, yielder } from '../../sched.mjs';

watchdog(30000);
const unhandled = [];
process.on('unhandledRejection', (err) => unhandled.push(err));
const p = await fromSandbox('./pitfalls.js');
const settle = async (turns = 20) => { for (let i = 0; i < turns; i++) await new Promise((r) => setImmediate(r)); };

await check('1. saveAll resolves only after every save has finished', async () => {
  for (let seed = 1; seed <= 10; seed++) {
    const pause = yielder(seed, 5);
    const saved = [];
    await within(2000, p.saveAll([1, 2, 3, 4, 5], async (n) => { await pause(); saved.push(n); }), 'saveAll');
    expectEqual(saved.slice().sort(), [1, 2, 3, 4, 5], `seed ${seed}: saved when saveAll resolved: `);
  }
});

await check('1. saveAll rejects when a save fails (instead of losing the error)', async () => {
  unhandled.length = 0;
  const err = await within(2000, p.saveAll([1, 2, 3], async (n) => { await settle(2); if (n === 2) throw new Error('disk full'); })
    .then(() => null, (e) => e), 'saveAll');
  await settle();
  expect(err?.message === 'disk full', err ? `rejected with "${err.message}"` : 'it resolved; the failure went nowhere');
});

await check('2. loadAll starts every load at once and keeps the order', async () => {
  let inFlight = 0; let max = 0;
  const pause = yielder(3, 5);
  const got = await within(2000, p.loadAll([5, 1, 4, 2, 3], async (id) => {
    inFlight += 1; max = Math.max(max, inFlight);
    await pause();
    inFlight -= 1;
    return `item-${id}`;
  }), 'loadAll');
  expectEqual(got, ['item-5', 'item-1', 'item-4', 'item-2', 'item-3'], 'results: ');
  expect(max === 5, `at most ${max} load(s) ran at once; expected all 5`);
});

await check('3. loadOr resolves to the value when load succeeds', async () => {
  expectEqual(await p.loadOr(async () => 'fresh', 'fallback'), 'fresh');
});

await check('3. loadOr resolves to the fallback when load rejects', async () => {
  const r = await p.loadOr(async () => { await settle(2); throw new Error('cache miss'); }, 'fallback').then((v) => ({ v }), (e) => ({ e }));
  expect(!r.e, `it rejected with "${r.e?.message}": the catch never saw it (hint: return await)`);
  expectEqual(r.v, 'fallback');
});

await check('4. startSync sends a failure to onError, with no unhandled rejection', async () => {
  unhandled.length = 0;
  const errors = [];
  p.startSync(async () => { await settle(3); throw new Error('offline'); }, (err) => errors.push(err));
  await settle(20);
  expect(unhandled.length === 0, `unhandled rejection: "${unhandled[0]?.message}" (in a real app this kills the process)`);
  expectEqual(errors.map((e) => e?.message), ['offline'], 'onError calls: ');
});

await check('4. startSync does not call onError when the sync succeeds', async () => {
  const errors = [];
  p.startSync(async () => { await settle(3); return 'ok'; }, (err) => errors.push(err));
  await settle(20);
  expectEqual(errors.length, 0, 'onError calls: ');
});

await check('5. canDelete waits for isAdmin: non-admins get false, admins true', async () => {
  expectEqual(await p.canDelete({ name: 'guest' }, async () => false), false, 'non-admin: ');
  expectEqual(await p.canDelete({ name: 'root' }, async () => true), true, 'admin: ');
});
