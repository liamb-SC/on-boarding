# 03 · Shared cache vs in-memory cache

**Skills:** why a per-process `Map` goes stale behind a load balancer, a
shared cache client, and deciding which data belongs where.

## Background
In production you run several copies of an app behind a load balancer. If each
copy caches in its own memory, then when instance **A** updates a price and
invalidates *its* cache, instance **B** never hears about it. B keeps serving
the old price until a restart or TTL. With a **shared cache** (Redis,
Memcached), every instance reads and invalidates the same keys.

|  | In-memory (per process) | Shared (Redis) |
|--|-------------------------|----------------|
| Speed | nanoseconds, no network | ~0.2–1 ms network hop |
| Consistency across instances | none: each one has its own copy | one copy for everyone |
| Survives a deploy/restart | no | yes |
| Good for | data that (almost) never changes | data that changes often or must agree everywhere |

## Scenario
`server.js` is a price service that uses cache-aside, and on writes it
invalidates the cache. `cache-server.js` is a tiny HTTP key-value server that
stands in for Redis, so this runs without Docker. `shared-cache.js` is the
client for it, and it's empty.

## Goal
1. Run `npm run demo -- local`. Two processes share one database, but each has
   its own `Map`. Watch B serve a stale price after A updates it.
2. Implement `get`, `set` and `del` in `shared-cache.js` with `fetch` against the
   cache server (the protocol is in the file's comment). Values are JSON.
3. Run `npm run demo -- shared`. B now sees the new price.
4. In `answers.json`, mark each item `local` or `shared`:

   | Key | What it is |
   |-----|------------|
   | `country-list` | ISO country codes, changed maybe once a year with a deploy |
   | `feature-flags` | toggled by the product team several times a day; every instance must agree right away |
   | `user-sessions` | the logged-in user; the next request may land on any instance |
   | `product-stock` | stock counts that change on every purchase |
   | `parsed-config-templates` | templates parsed from files at startup; only change on deploy |

## Hints
- ``const res = await fetch(`${url}/kv/${encodeURIComponent(key)}`)``, then
  check `res.status === 404`, and otherwise read `(await res.json()).value`.
- `set` is a `PUT` with `body: JSON.stringify({ value })`.
- Bonus, if you have Docker: run Redis (`docker run -p 6379:6379 redis:7-alpine`)
  and write the same three methods with the `redis` npm package
  (`get` / `set` / `del`, storing JSON strings). Nothing else in the app changes.

## Check your work
```
./onboard validate data/03
```
