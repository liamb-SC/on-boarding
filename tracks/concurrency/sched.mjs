// Deterministic "random" interleavings for the concurrency track's validators.
// Instead of real timers, async steps yield a seeded-random number of event
// loop turns, so a given seed always produces the same interleaving and a
// run of many seeds explores lots of them, without flakiness.

// mulberry32: a tiny seeded PRNG -> function returning floats in [0, 1)
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const turn = () => new Promise((resolve) => setImmediate(resolve));

// yielder(seed, max) -> async fn that waits 0..max event loop turns
export function yielder(seed, max = 3) {
  const next = rng(seed);
  return async () => {
    const n = Math.floor(next() * (max + 1));
    for (let i = 0; i < n; i++) await turn();
  };
}

// A db with the same API as the sandbox's db.js, but deterministic.
export function fakeDb(seed, initial = {}) {
  const rows = new Map(Object.entries(initial));
  const pause = yielder(seed);
  return {
    async get(key) { await pause(); return rows.get(key) ?? 0; },
    async set(key, value) { await pause(); rows.set(key, value); },
    peek: (key) => rows.get(key) ?? 0,
  };
}

// within(ms, promise, what) — reject instead of hanging forever.
export function within(ms, promise, what = 'it') {
  let t;
  const timeout = new Promise((_, reject) => { t = setTimeout(() => reject(new Error(`${what} never finished (waited ${ms}ms): stuck?`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}
