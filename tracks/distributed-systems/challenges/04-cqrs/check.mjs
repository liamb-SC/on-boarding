import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, stage, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const ref = stage(path.join(path.dirname(fileURLToPath(import.meta.url)), 'starter'), 'cqrs');
const { createEventStore, createProjector } = await fromSandbox(`${ref}/event-store.js`);
const { createCommandHandler } = await fromSandbox('./write-side.js');
const { createProjection } = await fromSandbox('./read-side.js');

const setup = () => {
  const store = createEventStore();
  return { store, commands: createCommandHandler(store) };
};
const rejects = (fn) => { try { fn(); } catch { return true; } return false; };
const types = (store) => store.readFrom(0).map((e) => e.type);

await check('commands append the right events', () => {
  const { store, commands } = setup();
  commands.handle({ type: 'OpenAccount', accountId: 'a1', owner: 'ada' });
  commands.handle({ type: 'Deposit', accountId: 'a1', amount: 100 });
  commands.handle({ type: 'Withdraw', accountId: 'a1', amount: 40 });
  expectEqual(store.readFrom(0).map(({ position, ...e }) => e), [
    { type: 'AccountOpened', accountId: 'a1', owner: 'ada' },
    { type: 'MoneyDeposited', accountId: 'a1', amount: 100 },
    { type: 'MoneyWithdrawn', accountId: 'a1', amount: 40 },
  ]);
});

await check('rule: an account can only be opened once', () => {
  const { store, commands } = setup();
  commands.handle({ type: 'OpenAccount', accountId: 'a1', owner: 'ada' });
  expect(rejects(() => commands.handle({ type: 'OpenAccount', accountId: 'a1', owner: 'eve' })), 'the second open was accepted');
  expect(store.length === 1, 'an event was appended for a rejected command');
});

await check('rule: deposits need an existing account and a positive amount', () => {
  const { store, commands } = setup();
  expect(rejects(() => commands.handle({ type: 'Deposit', accountId: 'nope', amount: 10 })), 'deposit into a missing account was accepted');
  commands.handle({ type: 'OpenAccount', accountId: 'a1', owner: 'ada' });
  expect(rejects(() => commands.handle({ type: 'Deposit', accountId: 'a1', amount: 0 })), 'a 0 deposit was accepted');
  expect(rejects(() => commands.handle({ type: 'Deposit', accountId: 'a1', amount: -5 })), 'a negative deposit was accepted');
  expectEqual(types(store), ['AccountOpened']);
});

await check('rule: a withdrawal cannot overdraw (the balance comes from the write side\'s own events)', () => {
  const { store, commands } = setup();
  commands.handle({ type: 'OpenAccount', accountId: 'a1', owner: 'ada' });
  commands.handle({ type: 'Deposit', accountId: 'a1', amount: 50 });
  commands.handle({ type: 'Withdraw', accountId: 'a1', amount: 30 });
  expect(rejects(() => commands.handle({ type: 'Withdraw', accountId: 'a1', amount: 21 })), 'withdrew 21 from a balance of 20');
  commands.handle({ type: 'Withdraw', accountId: 'a1', amount: 20 });
  expectEqual(types(store), ['AccountOpened', 'MoneyDeposited', 'MoneyWithdrawn', 'MoneyWithdrawn']);
});

await check('an unknown command type is rejected', () => {
  const { commands } = setup();
  expect(rejects(() => commands.handle({ type: 'Teleport', accountId: 'a1' })), 'accepted an unknown command');
});

// The read side is checked against hand-written events, so it doesn't depend on the write side.
const EVENTS = [
  { type: 'AccountOpened', accountId: 'a2', owner: 'ada' },
  { type: 'AccountOpened', accountId: 'a1', owner: 'ada' },
  { type: 'AccountOpened', accountId: 'b1', owner: 'bob' },
  { type: 'MoneyDeposited', accountId: 'a1', amount: 100 },
  { type: 'MoneyDeposited', accountId: 'a2', amount: 30 },
  { type: 'MoneyDeposited', accountId: 'b1', amount: 500 },
  { type: 'MoneyWithdrawn', accountId: 'b1', amount: 450 },
  { type: 'MoneyDeposited', accountId: 'a2', amount: 5 },
];
const projected = (events = EVENTS) => {
  const store = createEventStore();
  const view = createProjection();
  const projector = createProjector(store, view);
  events.forEach((e) => store.append(e));
  projector.catchUp();
  return { store, view, projector };
};

await check('read side: getAccount returns owner and balance (null if unknown)', () => {
  const { view } = projected();
  expectEqual(view.getAccount('a1'), { accountId: 'a1', owner: 'ada', balance: 100 });
  expectEqual(view.getAccount('b1'), { accountId: 'b1', owner: 'bob', balance: 50 });
  expect(view.getAccount('zz') === null, 'unknown account should be null');
});

await check('read side: accountsOf lists an owner\'s accounts sorted by id', () => {
  const { view } = projected();
  expectEqual(view.accountsOf('ada'), [{ accountId: 'a1', balance: 100 }, { accountId: 'a2', balance: 35 }]);
  expectEqual(view.accountsOf('nobody'), []);
});

await check('read side: topAccounts(n) by balance, highest first', () => {
  const { view } = projected();
  expectEqual(view.topAccounts(2), [{ accountId: 'a1', balance: 100 }, { accountId: 'b1', balance: 50 }]);
});

await check('read side: keeps up as new events arrive (incremental catch-up)', () => {
  const { store, view, projector } = projected();
  store.append({ type: 'MoneyDeposited', accountId: 'a2', amount: 1000 });
  projector.catchUp();
  expectEqual(view.topAccounts(1), [{ accountId: 'a2', balance: 1035 }]);
});

await check('end to end: commands -> events -> projection', () => {
  const { store, commands } = setup();
  const view = createProjection();
  const projector = createProjector(store, view);
  commands.handle({ type: 'OpenAccount', accountId: 'x', owner: 'zed' });
  commands.handle({ type: 'Deposit', accountId: 'x', amount: 70 });
  projector.catchUp();
  commands.handle({ type: 'Withdraw', accountId: 'x', amount: 20 });
  projector.catchUp();
  expectEqual(view.getAccount('x'), { accountId: 'x', owner: 'zed', balance: 50 });
});

await check('separation: the command side does not import the read side', () => {
  const src = readFileSync(path.join(SANDBOX, 'write-side.js'), 'utf8');
  expect(!/read-side/.test(src), 'write-side.js imports read-side.js; the write model must rebuild its own state from events');
});
