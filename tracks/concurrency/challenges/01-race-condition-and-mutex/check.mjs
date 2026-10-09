import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';
import { fakeDb, within, yielder } from '../../sched.mjs';

watchdog(30000);
const { Mutex } = await fromSandbox('./mutex.js');
const { Bank } = await fromSandbox('./bank.js');
const SEEDS = 20;

await check('acquire() resolves to a release function', async () => {
  const m = new Mutex();
  const release = await within(1000, m.acquire(), 'acquire() on a free mutex');
  expect(typeof release === 'function', 'acquire() should resolve to a function');
  release();
  (await within(1000, m.acquire(), 'acquire() after release()'))();
});

await check('only one task holds the lock at a time (across many interleavings)', async () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const m = new Mutex();
    const pause = yielder(seed);
    let active = 0; let max = 0; let done = 0;
    await within(3000, Promise.all(Array.from({ length: 30 }, () => m.runExclusive(async () => {
      active += 1; max = Math.max(max, active);
      await pause();
      active -= 1; done += 1;
    }))), 'runExclusive');
    expect(max === 1, `seed ${seed}: ${max} tasks were inside the lock at once`);
    expect(done === 30, `seed ${seed}: only ${done}/30 tasks ran`);
  }
});

await check('waiters get the lock in the order they asked (FIFO, so nobody starves)', async () => {
  const m = new Mutex();
  const pause = yielder(7);
  const order = [];
  await within(3000, Promise.all(Array.from({ length: 20 }, (_, i) => m.runExclusive(async () => { order.push(i); await pause(); }))));
  expectEqual(order, Array.from({ length: 20 }, (_, i) => i));
});

await check('runExclusive resolves with fn\'s result', async () => {
  expectEqual(await within(1000, new Mutex().runExclusive(async () => 42)), 42);
});

await check('runExclusive rejects with fn\'s error AND releases the lock', async () => {
  const m = new Mutex();
  const err = await within(1000, m.runExclusive(async () => { throw new Error('boom'); }).then(() => null, (e) => e));
  expect(err?.message === 'boom', err ? `rejected with "${err.message}"` : 'it resolved');
  expectEqual(await within(1000, m.runExclusive(() => 'still usable'), 'the next runExclusive after a throw'), 'still usable');
});

await check('Bank: 100 concurrent deposits of 1 always add up to 100', async () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const db = fakeDb(seed);
    const bank = new Bank(db);
    await within(5000, Promise.all(Array.from({ length: 100 }, () => bank.deposit('alice', 1))), 'the deposits');
    expect(db.peek('alice') === 100, `seed ${seed}: balance is ${db.peek('alice')} (lost updates)`);
  }
});

await check('Bank: 10 concurrent withdrawals of 10 from 50 -> exactly 5 succeed, never negative', async () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const db = fakeDb(seed, { bob: 50 });
    const bank = new Bank(db);
    const results = await within(5000, Promise.allSettled(Array.from({ length: 10 }, () => bank.withdraw('bob', 10))), 'the withdrawals');
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const bad = results.filter((r) => r.status === 'rejected' && r.reason?.message !== 'insufficient funds');
    expect(!bad.length, `seed ${seed}: unexpected error "${bad[0]?.reason?.message}"`);
    expect(ok === 5 && db.peek('bob') === 0, `seed ${seed}: ${ok} succeeded, balance ${db.peek('bob')}`);
  }
});
