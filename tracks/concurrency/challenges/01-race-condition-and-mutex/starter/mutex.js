// A mutual-exclusion lock for async code: at most one holder at a time,
// waiters served in the order they asked (FIFO).
//
//   const release = await mutex.acquire();
//   try { ...critical section... } finally { release(); }
//
//   const result = await mutex.runExclusive(async () => { ... });
export class Mutex {
  // Resolves to a release() function once the lock is yours.
  async acquire() {
    throw new Error('TODO: Mutex.acquire');
  }

  // Runs fn while holding the lock, ALWAYS releases it (even if fn throws),
  // and resolves/rejects with fn's result.
  async runExclusive(fn) {
    throw new Error('TODO: Mutex.runExclusive');
  }
}
