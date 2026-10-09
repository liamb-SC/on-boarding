# 01 · Race conditions and a mutex

**Skills:** spotting a race condition (lost update, check-then-act), critical
sections, and writing and using a FIFO async mutex.

## Background
Node runs your JavaScript on one thread, but that doesn't make it race-free.
Every `await` is a point where **other tasks run** before you resume:

```js
const balance = await db.get('alice');   // task A reads 10 ... task B reads 10
await db.set('alice', balance + 1);      // A writes 11     ... B writes 11 (A's update is lost)
```

That's a **race condition**: the result depends on the timing of the
interleaving. Two shapes come up all the time:
- **read-modify-write** (lost update): read a value, change it, write it back.
- **check-then-act**: "if the balance is enough, withdraw". The check is stale
  by the time you act.

The fix is to make the read-and-write a **critical section** that only one
task can be in at a time. A **mutex** (mutual exclusion lock) does that. Tasks
that want the lock while it's held wait in a queue. Serving them **in order
(FIFO)** means none of them can be overtaken forever (starved).

## Scenario
`npm start` runs `race.js`: 100 concurrent deposits of 1 give a balance well
below 100, and more withdrawals succeed than the money allows.

## Goal
1. Implement `Mutex` in `mutex.js`:
   - `acquire()` resolves to a `release()` function once the lock is free.
     Waiters get it in the order they called.
   - `runExclusive(fn)` acquires, runs `fn`, **always** releases (even if `fn`
     throws), and settles with `fn`'s result.
2. Use it in `bank.js` so `deposit` and `withdraw` are critical sections.
   Never hold the lock longer than needed.
3. `npm start` prints the expected numbers every time.

## Hints
- A mutex fits in about 15 lines. Keep a `locked` flag and a queue of
  `resolve` functions from waiters. `release()` either hands the lock straight
  to the next waiter, or unlocks if nobody is waiting.
- `new Promise((resolve) => queue.push(resolve))` is how a waiter "parks".
- `try { return await fn(); } finally { release(); }`
- The validator replays each scenario under 20 different interleavings, so a
  lucky pass doesn't count.

## Check your work
```
./onboard validate concurrency/01
```
