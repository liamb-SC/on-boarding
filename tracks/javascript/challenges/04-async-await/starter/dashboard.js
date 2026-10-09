import { getOrders, getUser, NotFoundError } from './api.js';

// 1. Load a user and their orders. The two calls don't depend on each other.
//    Resolves to { user, orders }.
export async function loadDashboard(userId) {
  const user = await getUser(userId);
  const orders = await getOrders(userId);
  return { user, orders };
}

// 2. Load many users at once. One failure must not lose the others.
//    Resolves to [{ id, ok: true, user } | { id, ok: false, error: '<message>' }, ...]
//    in the same order as `ids`.
export async function loadMany(ids) {
  const results = [];
  for (const id of ids) {
    results.push({ id, ok: true, user: await getUser(id) });
  }
  return results;
}

// 3. Load a user, or null if they don't exist. Any OTHER error is a real
//    problem and must still reach the caller.
export async function safeLoad(id) {
  try {
    return getUser(id);
  } catch {
    return null;
  }
}
