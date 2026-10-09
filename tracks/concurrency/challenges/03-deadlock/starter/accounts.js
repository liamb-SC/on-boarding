import { Mutex } from './mutex.js';

// Writing to the audit log takes a moment. (The validator swaps this out to
// replay many different interleavings.)
export const hooks = {
  audit: () => new Promise((resolve) => setTimeout(resolve, 1)),
};

// createAccounts({ a: 100, b: 50 }) -> { a: { id, balance, lock }, b: ... }
export function createAccounts(balances) {
  return Object.fromEntries(Object.entries(balances).map(([id, balance]) =>
    [id, { id, balance, lock: new Mutex() }]));
}

// Move `amount` from one account to another. Both accounts are locked while
// the money moves, so nobody sees (or overwrites) a half-done transfer.
export async function transfer(accounts, fromId, toId, amount) {
  const from = accounts[fromId];
  const to = accounts[toId];

  const releaseFrom = await from.lock.acquire();
  try {
    await hooks.audit(`locked ${fromId}`);
    const releaseTo = await to.lock.acquire();
    try {
      const fromBalance = from.balance;
      const toBalance = to.balance;
      if (fromBalance < amount) throw new Error('insufficient funds');
      await hooks.audit(`moving ${amount} from ${fromId} to ${toId}`);
      from.balance = fromBalance - amount;
      to.balance = toBalance + amount;
    } finally {
      releaseTo();
    }
  } finally {
    releaseFrom();
  }
}
