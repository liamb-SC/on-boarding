# Track: Concurrency (in Node.js)

The classic concurrency problems, felt first-hand in Node: async tasks taking
turns on the event loop, and real parallel threads with `worker_threads`
and shared memory. Each challenge breaks something, then fixes it.

## Requirements
Node.js 20+. No npm packages, everything uses Node's standard library.
Challenge 05 is more interesting on a machine with several CPU cores.

## Learning objectives
By the end you can:
- Spot race conditions (lost update, check-then-act) in async code and fix them with a mutex.
- Use `SharedArrayBuffer` and `Atomics` (add, compare-and-swap) across worker threads.
- Explain the four deadlock conditions and prevent deadlock with lock ordering.
- Recognise the common async/await pitfalls: `forEach`, accidental serialisation, `return await`, floating promises.
- Build a fixed-size worker pool, and explain libuv's thread pool and context switches.
- Recognise starvation and keep the event loop responsive by yielding.
- Use immutable updates and `Object.freeze` to make shared state safe.
- Respect backpressure with `write()`/`'drain'`, `highWaterMark` and `pipeline`.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | race-condition-and-mutex | lost update, check-then-act, critical section, FIFO mutex |
| 02 | atomics-and-workers | `worker_threads`, `SharedArrayBuffer`, `Atomics.add`, compare-and-swap |
| 03 | deadlock | Coffman conditions, lock ordering |
| 04 | async-pitfalls | `forEach` + async, sequential awaits, `return await`, floating promises |
| 05 | thread-pool-and-context-switches | worker pool + queue, `UV_THREADPOOL_SIZE`, voluntary vs involuntary switches |
| 06 | starvation | event loop blocking, `setImmediate` vs microtasks, aging |
| 07 | immutability | immutable updates, deep freeze, shared defaults |
| 08 | backpressure | `highWaterMark`, `'drain'`, `stream/promises` `pipeline` |

The validators replay each scenario under many deterministic interleavings
(seeded, not random), so a lucky run never passes and a correct fix never
fails by chance.

Start with: `./onboard start concurrency/01`
