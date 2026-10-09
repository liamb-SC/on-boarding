// A pretend database: every get/set is async and takes a few milliseconds,
// like a real network round trip. Don't edit this file.
const pause = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 3));

export function createDb(initial = {}) {
  const rows = new Map(Object.entries(initial));
  return {
    async get(key) { await pause(); return rows.get(key) ?? 0; },
    async set(key, value) { await pause(); rows.set(key, value); },
  };
}
