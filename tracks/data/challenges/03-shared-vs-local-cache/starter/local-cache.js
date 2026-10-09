// An in-memory cache: a Map that lives inside ONE process. Fast and simple,
// but every app instance has its own copy. Same async interface as a shared
// cache, so the app can use either.
export function createLocalCache() {
  const map = new Map();
  return {
    async get(key) { return map.get(key); },
    async set(key, value) { map.set(key, value); },
    async del(key) { map.delete(key); },
  };
}
