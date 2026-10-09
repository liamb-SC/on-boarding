# 02 · Real threads: SharedArrayBuffer and Atomics

**Skills:** `worker_threads`, shared memory, why `x++` isn't atomic,
`Atomics.add`, and compare-and-swap (`Atomics.compareExchange`).

## Background
Challenge 01's races happened at `await`s. With **worker threads**, code runs
truly in parallel on several CPU cores, so a race can happen **between any two
machine instructions**.

Workers normally share nothing: `postMessage` **copies** data. A
`SharedArrayBuffer` is the exception, because every thread sees the same bytes.
That's fast, but `counter[0]++` is really three steps:

```
read counter (5)  ->  add 1 (6)  ->  write 6        # thread A
      read counter (5)  ->  add 1 (6)  ->  write 6  # thread B: one increment lost
```

**Atomic operations** do the read-modify-write as one indivisible step, so no
other thread can see or cause a half-finished state:

```js
Atomics.add(view, 0, 1);                 // returns the old value
Atomics.load(view, 0);                   // a read that's guaranteed fresh
Atomics.compareExchange(view, 0, expected, replacement);
// "if view[0] is still `expected`, set it to `replacement`". Returns what was
// really there, so you can tell whether you won.
```

`compareExchange` (**compare-and-swap**, CAS) is the building block for any
atomic update that isn't built in. Read the value, compute the new one, and
CAS it in. If another thread changed it meanwhile, read again and retry.

## Scenario
`npm start` counts to 4,000,000 with 4 threads and gets much less, and a
different total on every run. `atomic-max.js` has the same bug in
check-then-act form.

## Goal
1. Fix `counter-worker.js` with `Atomics.add`, so `npm start` is exact every
   run.
2. Rewrite `atomicMax(view, index, value)` in `atomic-max.js` as a CAS loop:
   `Atomics.load` the current value, stop if it's already `>= value`,
   otherwise `Atomics.compareExchange`, and retry if you lost the race.

## Hints
- Notice that the fix for (1) is **not** a mutex: a single atomic instruction
  is cheaper than any lock.
- In the CAS loop, the value `compareExchange` returns is the freshest one
  there is, so use it as the next `current`.
- Atomics only work on integer typed arrays (`Int32Array`, `BigInt64Array`,
  ...) backed by a `SharedArrayBuffer`.

## Check your work
```
./onboard validate concurrency/02
```
