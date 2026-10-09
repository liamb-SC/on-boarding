import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const { TtlCache, createUserService } = await fromSandbox('./cache.js');
const { createDb } = await fromSandbox('./db.js');

// A clock the checks can move forward by hand.
const clock = () => { const c = { t: 1_000_000 }; c.now = () => c.t; return c; };
const service = (ttlMs = 1000, c = clock()) => {
  const db = createDb();
  return { db, c, users: createUserService({ db, cache: new TtlCache({ ttlMs, now: c.now }) }) };
};

await check('TtlCache: set then get returns the value', () => {
  const cache = new TtlCache({ ttlMs: 1000 });
  cache.set('k', { a: 1 });
  expectEqual(cache.get('k'), { a: 1 });
});

await check('TtlCache: an entry expires once its TTL has passed', () => {
  const c = clock();
  const cache = new TtlCache({ ttlMs: 1000, now: c.now });
  cache.set('k', 'v');
  c.t += 999;
  expect(cache.get('k') === 'v', 'expired too early (at 999ms of a 1000ms TTL)');
  c.t += 2;
  expect(cache.get('k') === undefined, 'still returned the value after its TTL');
});

await check('TtlCache: delete removes an entry', () => {
  const cache = new TtlCache({ ttlMs: 1000 });
  cache.set('k', 'v');
  cache.delete('k');
  expect(cache.get('k') === undefined, 'get still returns the deleted value');
});

await check('cache-aside: reading the same user twice hits the db once', async () => {
  const { db, users } = service();
  const a = await users.getUser('1');
  const b = await users.getUser('1');
  expectEqual(b, a);
  expect(a?.name === 'Ada', `getUser('1') returned ${JSON.stringify(a)}`);
  expect(db.stats.reads === 1, `db.getUser was called ${db.stats.reads} times`);
});

await check('TTL: after the TTL the user is re-read from the db', async () => {
  const { db, c, users } = service(1000);
  await users.getUser('1');
  c.t += 1001;
  await users.getUser('1');
  expect(db.stats.reads === 2, `expected 2 db reads, got ${db.stats.reads}`);
});

await check('write-through: updateUser saves to the db and the next read is fresh, with no extra db read', async () => {
  const { db, users } = service();
  await users.getUser('2');
  await users.updateUser('2', { plan: 'pro' });
  const readsBefore = db.stats.reads;
  const u = await users.getUser('2');
  expect(u?.plan === 'pro', `getUser returned stale data: ${JSON.stringify(u)}`);
  expect(db.stats.writes === 1, 'updateUser did not save to the db');
  expect(db.stats.reads === readsBefore, 'the read after updateUser went to the db; write-through should have filled the cache');
});

await check('invalidation: a deleted user is not served from the cache', async () => {
  const { users } = service();
  await users.getUser('3');
  await users.deleteUser('3');
  const u = await users.getUser('3');
  expect(u === null, `got ${JSON.stringify(u)} after deleting the user`);
});

await check('stampede: 20 concurrent reads of an uncached user cause ONE db read', async () => {
  const { db, users } = service();
  const results = await Promise.all(Array.from({ length: 20 }, () => users.getUser('3')));
  expect(results.every((u) => u?.name === 'Linus'), 'not every caller got the user');
  expect(db.stats.reads === 1, `db.getUser was called ${db.stats.reads} times`);
});

await check('stampede: a failed db read is not cached (the next call tries again)', async () => {
  const { db, users } = service();
  const real = db.getUser;
  let fail = true;
  db.getUser = async (id) => { if (fail) { fail = false; throw new Error('db timeout'); } return real(id); };
  await users.getUser('1').then(() => { throw new Error('the first call should have failed'); }, () => {});
  const u = await users.getUser('1');
  expect(u?.name === 'Ada', 'the second call returned the cached failure instead of retrying');
});
