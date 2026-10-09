# 09 · From DBA to distributed: indexes, then sharding

**Skills:** reading `EXPLAIN QUERY PLAN`, composite and covering indexes,
the cost of indexes, hash partitioning, shard routing, scatter-gather queries.

## Background
Scaling a database usually happens in this order:

1. **Make each query cheap.** An index turns a full table scan, O(n), into a
   B-tree lookup, O(log n). A **composite index** `(customer_id, created_at)`
   finds one customer's rows *already sorted by date*, so the sort step
   disappears too. A **covering index** contains every column a query needs,
   so the table itself is never read. Every index makes writes slower and
   takes space, so add only the ones your queries need.
2. Scale reads with replicas and caches (challenges 02–05).
3. **Partition (shard)** when one machine can't hold the data or absorb the
   writes. Choose a **shard key** so the common queries hit **one** shard.
   Hash it so the load spreads evenly. Ranges of sequential ids, or plain
   `id % n`, give hot spots. Queries that don't include the key must
   **scatter-gather**: ask every shard and merge the answers. That's slow,
   so keep them rare.

## Scenario
Part 1: `seed.js` loads 20,000 orders into SQLite with no indexes, and
defines the two queries the app runs all day. Part 2: the orders outgrow one
server. `shards.js` simulates shard servers, and `router.js` decides where
data goes.

## Goal
1. Run `npm run explain` and read the plans (`SCAN orders` = reads every row).
2. In `indexes.sql`, add **at most 2** indexes, so that neither query scans
   the table and "my orders" needs no `TEMP B-TREE` sort. Run
   `npm run explain` again and compare the plans and timings.
3. In `router.js`:
   - `shardFor(customerId, n)`: a deterministic **hash** of the id, mod `n`.
   - `insert` routes by `customer_id`. `ordersForCustomer` asks exactly one
     shard. `countAll` asks every shard and adds up the answers.

   `npm run shards` shows the distribution and which shards each call touched.

## Hints
- Put the equality column first in a composite index, then the column you sort by.
- `import { createHash } from 'node:crypto'` and then
  `createHash('md5').update(String(id)).digest().readUInt32BE(0) % n` is a fine hash.
- `Promise.all(shards.map((s) => s.count()))` runs the scatter in parallel.
- Real-world shard maps rarely use `hash % n` directly, because changing `n`
  moves almost every key. Look up *consistent hashing* afterwards.

## Check your work
```
./onboard validate data/09
```
