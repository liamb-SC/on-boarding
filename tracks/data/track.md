# Track: Data

Where data lives once one database isn't enough: Redis and caching, CDNs,
read replicas, change data capture, document and key-value models, and the
path from tuning indexes to sharding.

## Requirements
- Node.js 20+ and npm. Challenges 06, 07 and 09 install `sql.js` (SQLite
  compiled to WebAssembly, no native build), so they need network access to
  the npm registry.
- Docker for challenge 01 only (it runs `redis:7-alpine`). Everything else runs
  in plain Node. 03 and 08 have optional Docker bonuses.

## Learning objectives
By the end you can:
- Use Redis strings, counters, TTLs, hashes and lists from `redis-cli`.
- Implement cache-aside, write-through, TTL expiry, invalidation and stampede protection.
- Explain why per-process caches go stale behind a load balancer, and choose local vs shared caching.
- Set `Cache-Control`, `s-maxage`, `immutable` and ETags so a CDN caches the right things.
- Route reads to replicas while keeping read-your-writes consistency.
- Capture changes with a transactional outbox and project them into a read model.
- Query JSON columns and model data as documents (embed vs reference).
- Design DynamoDB keys and a GSI from access patterns.
- Read query plans, add the right indexes, then shard by a hashed key.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | redis-basics | Redis in Docker, `SET`/`INCR`/`EX`/`TTL`, `HSET`, `RPUSH`/`LPOP` |
| 02 | caching-strategies | cache-aside, write-through, TTL, invalidation, single-flight |
| 03 | shared-vs-local-cache | stale per-process `Map`s, shared cache client, what belongs where |
| 04 | cdn-cache-headers | `Cache-Control`, `s-maxage`, `immutable`, `ETag`, `304` |
| 05 | read-replicas | replication lag, LSNs, round-robin, read-your-writes |
| 06 | cdc-outbox | transactional outbox, tailing a log, projections, checkpoints |
| 07 | documents-and-json | `json_extract`, `json_each`, embedding vs referencing |
| 08 | dynamodb-single-table | PK/SK, item collections, `begins_with`, GSI, sparse index |
| 09 | indexes-to-sharding | `EXPLAIN QUERY PLAN`, composite indexes, hash sharding, scatter-gather |

Start with: `./onboard start data/01`
