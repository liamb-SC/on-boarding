import { cpSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, stage, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog(60000);
const here = path.dirname(fileURLToPath(import.meta.url));
const ref = stage(path.join(here, 'starter'), 'scaling');
cpSync(path.resolve(here, '../../fixtures/sqlite.js'), path.join(SANDBOX, ref, 'sqlite.js'));
const { seededDb, QUERIES } = await fromSandbox(`${ref}/seed.js`);
const { createShard } = await fromSandbox(`${ref}/shards.js`);
const { shardFor, createShardedStore } = await fromSandbox('./router.js');

// ---- Part 1: indexes ------------------------------------------------------
const db = await seededDb();
const { recentForCustomer: recent, countByStatus: count } = QUERIES;
const before = { recent: db.all(recent.sql, recent.params), count: db.all(count.sql, count.params) };
let applied = false;

await check('indexes.sql runs without errors', () => {
  db.exec(readFileSync(path.join(SANDBOX, 'indexes.sql'), 'utf8'));
  applied = true;
});

const plan = (q) => db.plan(q.sql, q.params).join(' | ');

await check('indexes.sql creates 1 or 2 indexes on orders (every index slows down writes)', () => {
  const n = db.get("SELECT count(*) AS n FROM sqlite_master WHERE type = 'index' AND tbl_name = 'orders' AND sql IS NOT NULL").n;
  expect(applied && n >= 1 && n <= 2, `found ${n} indexes`);
});

await check('"my orders" query: no full table scan', () => {
  const p = plan(recent);
  expect(!/SCAN orders/.test(p) && /INDEX/.test(p), `plan: ${p}`);
});

await check('"my orders" query: no separate sort step (the index already gives created_at order)', () => {
  const p = plan(recent);
  expect(!/TEMP B-TREE/.test(p), `plan: ${p}  (index customer_id AND created_at together)`);
});

await check('status count: answered from an index, without a table scan', () => {
  const p = plan(count);
  expect(!/SCAN orders\b(?! USING)/.test(p) && /INDEX/.test(p), `plan: ${p}`);
});

await check('the queries still return the same results', () => {
  expectEqual(db.all(recent.sql, recent.params), before.recent, 'my orders: ');
  expectEqual(db.all(count.sql, count.params), before.count, 'status count: ');
});

// ---- Part 2: sharding -----------------------------------------------------
const range = (from, to, step = 1) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

await check('shardFor: deterministic integer in [0, shardCount)', () => {
  for (const n of [4, 8]) {
    for (const id of range(1, 500)) {
      const s = shardFor(id, n);
      expect(Number.isInteger(s) && s >= 0 && s < n, `shardFor(${id}, ${n}) = ${s}`);
      expect(shardFor(id, n) === s, `shardFor(${id}, ${n}) gave different answers`);
    }
  }
});

function spread(ids, n) {
  const counts = new Array(n).fill(0);
  ids.forEach((id) => { counts[shardFor(id, n)] += 1; });
  const fair = ids.length / n;
  expect(counts.every((c) => Math.abs(c - fair) <= fair * 0.2), `customers per shard: ${JSON.stringify(counts)}`);
}

await check('shardFor: spreads customers 1..1000 evenly over 4 shards (within 20%)', () => spread(range(1, 1000), 4));
await check('shardFor: still even for ids that are all multiples of 4 (a plain id % n would not be)', () =>
  spread(range(4, 40000, 4), 4));

const orders = range(1, 600).map((i) => ({ id: i, customer_id: 1 + (i % 60), total: i }));
const fresh = async () => {
  const shards = ['s0', 's1', 's2', 's3'].map(createShard);
  const store = createShardedStore(shards);
  for (const o of orders) await store.insert(o);
  const used = shards.filter((s) => s.stats.queries > 0).length;
  expect(used >= 3, `all 600 orders went to ${used} shard(s); route each one by shardFor(customer_id)`);
  shards.forEach((s) => { s.stats.queries = 0; });
  return { shards, store };
};

await check('insert: each order lands on shardFor(customer_id)', async () => {
  const { shards } = await fresh();
  for (const c of [1, 17, 42]) {
    const owner = shardFor(c, 4);
    for (const [i, s] of shards.entries()) {
      const n = (await s.findByCustomer(c)).length;
      expect(i === owner ? n === 10 : n === 0, `customer ${c}: shard ${i} holds ${n} of their orders (owner is ${owner})`);
    }
  }
});

await check('ordersForCustomer: returns all their orders and touches exactly one shard', async () => {
  const { shards, store } = await fresh();
  const got = await store.ordersForCustomer(17);
  expect(got.length === 10 && got.every((o) => o.customer_id === 17), `got ${got.length} orders`);
  const touched = shards.filter((s) => s.stats.queries > 0).length;
  expect(touched === 1, `${touched} shards were queried`);
});

await check('countAll: scatter-gather over every shard', async () => {
  const { shards, store } = await fresh();
  const n = await store.countAll();
  expect(n === 600, `countAll() = ${n}`);
  expect(shards.every((s) => s.stats.queries === 1), `queries per shard: ${shards.map((s) => s.stats.queries)}`);
});
