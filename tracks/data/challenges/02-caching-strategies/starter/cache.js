// A small in-process cache with a time-to-live, and a user service that uses it.
// `now` is injectable so tests can fast-forward time instead of waiting.

export class TtlCache {
  constructor({ ttlMs = 60_000, now = Date.now } = {}) {
    this.ttlMs = ttlMs;
    this.now = now;
    this.entries = new Map(); // key -> { value, expiresAt }
  }

  // Return the value, or undefined if it's missing or has expired.
  get(key) {
    // TODO
    return undefined;
  }

  set(key, value) {
    // TODO: remember when this entry expires
  }

  delete(key) {
    // TODO
  }
}

export function createUserService({ db, cache }) {
  return {
    // TODO cache-aside: check the cache first; on a miss read the db and fill the cache.
    // TODO stampede protection: concurrent misses for the same id share ONE db read.
    async getUser(id) {
      return db.getUser(id);
    },

    // TODO write-through: save to the db, then put the saved user in the cache.
    async updateUser(id, changes) {
      const current = await db.getUser(id);
      return db.saveUser({ ...current, ...changes, id });
    },

    // TODO invalidation: a deleted user must not be served from the cache.
    async deleteUser(id) {
      await db.deleteUser(id);
    },
  };
}
