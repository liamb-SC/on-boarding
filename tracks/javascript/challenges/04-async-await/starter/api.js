// A pretend remote API. Every call takes ~50ms. Don't edit this file: the
// validator uses its own copy, and counts how many calls are in flight at once.

export class NotFoundError extends Error {
  name = 'NotFoundError';
}

const users = { 1: { id: 1, name: 'Ada' }, 2: { id: 2, name: 'Linus' }, 3: { id: 3, name: 'Grace' } };
const orders = { 1: ['mug', 'tee'], 2: [], 3: ['cap'] };

export const calls = { inFlight: 0, maxInFlight: 0, total: 0 };

function remote(fn) {
  calls.total += 1;
  calls.inFlight += 1;
  calls.maxInFlight = Math.max(calls.maxInFlight, calls.inFlight);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      calls.inFlight -= 1;
      try { resolve(fn()); } catch (err) { reject(err); }
    }, 50);
  });
}

// getUser(id) -> user. Rejects with NotFoundError for an unknown id, and with
// a plain Error('database unavailable') for id -1.
export function getUser(id) {
  return remote(() => {
    if (id === -1) throw new Error('database unavailable');
    if (!users[id]) throw new NotFoundError(`user ${id} not found`);
    return users[id];
  });
}

// getOrders(userId) -> array of order names (empty for unknown users)
export function getOrders(userId) {
  return remote(() => orders[userId] ?? []);
}
