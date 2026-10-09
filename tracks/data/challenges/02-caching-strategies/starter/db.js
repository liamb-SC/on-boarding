// A pretend database: every call is slow (20ms) and counted, so you can see
// exactly how many trips your cache saves. Don't edit this file.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function createDb(users = [
  { id: '1', name: 'Ada', plan: 'pro' },
  { id: '2', name: 'Grace', plan: 'free' },
  { id: '3', name: 'Linus', plan: 'free' },
]) {
  const rows = new Map(users.map((u) => [u.id, { ...u }]));
  const stats = { reads: 0, writes: 0, deletes: 0 };
  return {
    stats,
    async getUser(id) {
      stats.reads += 1;
      await sleep(20);
      const row = rows.get(id);
      return row ? { ...row } : null;
    },
    async saveUser(user) {
      stats.writes += 1;
      await sleep(20);
      rows.set(user.id, { ...user });
      return { ...user };
    },
    async deleteUser(id) {
      stats.deletes += 1;
      await sleep(20);
      rows.delete(id);
    },
  };
}
