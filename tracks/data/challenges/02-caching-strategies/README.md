# 02 · Caching strategies

**Skills:** cache-aside, write-through, TTLs, invalidation, and stopping a
cache stampede.

## Background
| Strategy | How it works | Watch out for |
|----------|--------------|---------------|
| **Cache-aside** (lazy loading) | Read the cache first. On a miss, read the db and put the result in the cache. | The first read is always slow, and data can be stale until it expires. |
| **Write-through** | Every write goes to the db **and** the cache, so reads after a write are fresh. | Extra work on every write, and you cache things nobody reads. |
| **TTL** | Every entry expires after N seconds. | Choosing N trades staleness against load on the db. |
| **Invalidation** | On a change, delete the key so the next read reloads it. | "There are only two hard things in computer science…" |

A **stampede** (or thundering herd) happens when a hot key expires and 500
requests all miss at once, so 500 identical queries hit the db. The simplest
fix is **single-flight**: the first miss starts the load, and everyone else
waits on the same promise.

## Scenario
`db.js` is a slow, call-counting fake database. `cache.js` has a `TtlCache`
skeleton and a `createUserService` that always goes straight to the db.

## Goal
In `cache.js`:
1. Finish `TtlCache`: `get` returns `undefined` once an entry is older than
   `ttlMs` (use `this.now()`, not `Date.now()`), and `delete` removes an entry.
2. `getUser`: **cache-aside**.
3. `updateUser`: **write-through**. Afterwards, `getUser` returns the new data
   without touching the db.
4. `deleteUser`: **invalidate**, so a deleted user is never served from the cache.
5. `getUser`: **stampede protection**. Concurrent misses for one id share a
   single db read, and a failed read is not cached.

Run `npm run demo` to see the db read counts.

## Hints
- Store `{ value, expiresAt: this.now() + this.ttlMs }`.
- For single-flight, keep a `Map` of id → in-flight promise next to the cache.
  Remove the entry in a `finally`, so a rejected promise doesn't stick around.
- A `null` (user not found) is a valid result. Decide whether to cache it.
  Caching "not found" for a short time is called *negative caching*.

## Check your work
```
./onboard validate data/02
```
