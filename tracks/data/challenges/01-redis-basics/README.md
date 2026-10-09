# 01 · Redis basics

**Skills:** running Redis in Docker, `redis-cli`, strings, `INCR`, TTLs
(`EX`, `TTL`, `PERSIST`), hashes, lists as a queue.

## Background
Redis is an in-memory key-value store that every app instance can share. Each
key holds a typed value:

| Type | Use it for | Commands |
|------|------------|----------|
| string | a value, a counter, a JSON blob | `SET`, `GET`, `INCR` |
| hash | one object with named fields | `HSET`, `HGET`, `HGETALL` |
| list | a queue or a recent-items feed | `RPUSH`, `LPOP`, `LRANGE` |

Any key can have a **TTL** (time to live). Redis deletes it when the TTL runs
out, which makes it a natural fit for sessions, rate limits and caches. Every
command is atomic, so `INCR` is safe even when 50 servers call it at once.

## Scenario
You need a scratch Redis to try things out. You'll start it in Docker and use
`redis-cli` inside the container. There's nothing to install locally.

## Goal
1. Start Redis in a container named **`onboard-redis`**:
   `docker run -d --name onboard-redis -p 6379:6379 redis:7-alpine`
2. Open a shell with `./redis-cli.sh` (it runs `docker exec -it onboard-redis redis-cli`), then:
   - Set `greeting` to `hello redis`, with **no** expiry.
   - Make `page:home:views` equal `3` using only `INCR`.
   - Store the session `session:abc123` = `alice`, expiring in **one hour**.
   - Create the hash `user:42` with exactly three fields: `name` = `Ada`,
     `email` = `ada@example.com` and `plan` = `pro`.
   - Use `jobs` as a queue: push `resize`, `email`, `report` and `cleanup`
     onto the tail, in that order. Then pop **one** job off the head, as a
     worker would.

## Hints
- `SET key value EX 3600` sets a value with a TTL. `TTL key` shows the
  seconds left: `-1` means no expiry, `-2` means the key doesn't exist.
- `TYPE key` tells you what a key holds. `KEYS *` is fine on a scratch box,
  but never run it in production because it blocks the server.
- `RPUSH` adds to the tail, `LPOP` takes from the head, and `LRANGE jobs 0 -1`
  shows the whole list.
- Made a mess? `FLUSHALL` empties this scratch Redis, or `./onboard reset data/01`
  removes the container so you can start again.
- From Node, the `redis` npm package works the same way:
  `await client.hSet('user:42', { name: 'Ada' })`.

## Check your work
```
./onboard validate data/01
```
