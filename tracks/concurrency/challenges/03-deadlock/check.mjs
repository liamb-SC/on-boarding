import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { rng, within, yielder } from '../../sched.mjs';

watchdog(60000);
const mod = await fromSandbox('./accounts.js');
const { createAccounts, transfer, hooks } = mod;
const total = (accounts) => Object.values(accounts).reduce((sum, a) => sum + a.balance, 0);

// A deadlocked transfer never settles, so every scenario runs under a timeout.
await check('alice -> bob and bob -> alice at the same time both finish (20 interleavings)', async () => {
  for (let seed = 1; seed <= 20; seed++) {
    hooks.audit = yielder(seed);
    const accounts = createAccounts({ alice: 100, bob: 100 });
    await within(2000, Promise.all([
      transfer(accounts, 'alice', 'bob', 10),
      transfer(accounts, 'bob', 'alice', 20),
    ]), `seed ${seed}: the two transfers`);
    expectEqual([accounts.alice.balance, accounts.bob.balance], [110, 90], `seed ${seed}: `);
  }
});

await check('a cycle of three (a -> b, b -> c, c -> a) finishes too', async () => {
  for (let seed = 1; seed <= 20; seed++) {
    hooks.audit = yielder(seed);
    const accounts = createAccounts({ a: 10, b: 10, c: 10 });
    await within(2000, Promise.all([transfer(accounts, 'a', 'b', 1), transfer(accounts, 'b', 'c', 1), transfer(accounts, 'c', 'a', 1)]),
      `seed ${seed}: the three transfers`);
  }
});

await check('200 random concurrent transfers: all finish, no money created or lost, none negative', async () => {
  for (let seed = 1; seed <= 10; seed++) {
    hooks.audit = yielder(seed);
    const next = rng(seed);
    const ids = ['a', 'b', 'c', 'd', 'e'];
    const accounts = createAccounts(Object.fromEntries(ids.map((id) => [id, 100])));
    const pick = () => ids[Math.floor(next() * ids.length)];
    const jobs = [];
    for (let i = 0; i < 200; i++) {
      const from = pick();
      let to = pick();
      if (to === from) to = ids[(ids.indexOf(from) + 1) % ids.length];
      jobs.push(transfer(accounts, from, to, 1 + Math.floor(next() * 40)));
    }
    const results = await within(5000, Promise.allSettled(jobs), `seed ${seed}: the transfers`);
    const odd = results.find((r) => r.status === 'rejected' && r.reason?.message !== 'insufficient funds');
    expect(!odd, `seed ${seed}: unexpected error "${odd?.reason?.message}"`);
    expect(total(accounts) === 500, `seed ${seed}: total is ${total(accounts)}, expected 500 (did a lock go missing?)`);
    expect(Object.values(accounts).every((a) => a.balance >= 0), `seed ${seed}: an account went negative`);
  }
});

await check('a transfer to the same account rejects (and does not hang)', async () => {
  hooks.audit = yielder(1);
  const accounts = createAccounts({ a: 10 });
  const err = await within(1000, transfer(accounts, 'a', 'a', 5).then(() => null, (e) => e), 'transfer a -> a');
  expect(err, 'it resolved: moving money to the same account should be refused');
  expectEqual(err.message, 'cannot transfer to the same account');
  expectEqual(accounts.a.balance, 10, 'balance: ');
});

const answers = (() => {
  try { return JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8')); } catch { return {}; }
})();
const norm = (v) => String(v ?? '').trim().toLowerCase().replace(/[^a-z]/g, '');
await check('answers.json q1: which deadlock condition does lock ordering remove?', () => {
  expect(norm(answers.q1), 'answer with a, b, c or d');
  expect(norm(answers.q1) === 'd', 'not quite. Which condition needs a loop of tasks each waiting on the next?');
});
await check('answers.json q2: what happens if refund() takes the locks in its own order?', () => {
  expect(norm(answers.q2), 'answer with a, b or c');
  expect(norm(answers.q2) === 'b', 'not quite. An ordering only works if every caller follows it');
});
