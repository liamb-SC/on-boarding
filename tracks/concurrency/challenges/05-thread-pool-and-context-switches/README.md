# 05 · Thread pools and context switches

**Skills:** building a fixed-size worker pool with a task queue, libuv's
built-in thread pool, and what context switches are and how to observe them.

## Background
**Thread pool.** Starting a worker thread is expensive: each one is a whole
new V8 instance, which costs tens of milliseconds and several MB. A pool
starts **N workers once** and feeds them tasks from a **queue**. Each idle
worker takes the next task, and when every worker is busy, new tasks wait.
For CPU-bound work, `N = os.availableParallelism()` is the usual choice:
more threads than cores can't run at the same time anyway.

Node already has a pool you use every day. **libuv** runs `fs`,
`dns.lookup`, `crypto.pbkdf2`, `zlib`, ... on `UV_THREADPOOL_SIZE` threads
(default **4**). That's why a burst of slow hashing or file I/O can queue up
behind itself.

**Context switch.** A CPU core runs one thread at a time. To run another, the
OS saves the current thread's registers and state and loads the next
thread's. That's a context switch, and it costs time and cache.
- **voluntary**: the thread gave up the CPU itself, by blocking on I/O, a
  lock or `Atomics.wait`.
- **involuntary**: the OS **preempted** it because its time slice ran out
  and another thread was waiting.

With more CPU-bound threads than cores, they keep preempting each other. You
pay more context switches and get no extra throughput.

(The event loop has the same trade-off at a smaller scale. Every `await` is a
cheap, **cooperative** switch between tasks on one thread. Challenge 06 shows
what happens when a task never yields.)

## Scenario
`main.js` wants to count primes in parallel with `WorkerPool`, but `pool.js`
is a skeleton. `task-worker.js` is done.

## Goal
1. Implement `WorkerPool` in `pool.js`:
   - start `size` workers from `workerFile` in the constructor
   - `run(data)` posts `data` to an idle worker, or queues it until one is
     free. It resolves with the reply's `result`, or rejects with
     `new Error(reply.error)`.
   - `close()` terminates every worker
   `npm start` should use exactly `size` threads.
2. Run `npm run observe`. It runs the same CPU work on 1× and 4× as many
   threads as you have cores, and saves the context-switch counts to
   `observations.json`. On Linux/WSL, `taskset -c 0-1 npm run observe` pins
   it to 2 cores. The numbers are noisy on a busy machine, so run it a couple
   of times and look at the trend.
3. Run `npm run uv-pool`, then `UV_THREADPOOL_SIZE=8 npm run uv-pool`, and
   compare the finish times.
4. In `answers.json`:
   - **q1**: a good size for a CPU-bound pool is
     a) `os.availableParallelism()`, b) 100, since more threads means more
     throughput, c) 1, since Node is single-threaded
   - **q2**: the extra context switches when threads > cores are mostly
     a) voluntary, b) involuntary
   - **q3**: with the default libuv pool, 8 `pbkdf2` calls started together
     finish in how many "waves"? (a number)

## Hints
- Keep an array of idle workers and an array of queued
  `{ data, resolve, reject }`. When a task arrives or a worker frees up,
  call a `dispatch()` that pairs them.
- Each worker does one task at a time, so remember the current task's
  `resolve`/`reject` per worker (a `Map`, or a property on the worker).
- `worker.terminate()` returns a Promise.

## Check your work
```
./onboard validate concurrency/05
```
