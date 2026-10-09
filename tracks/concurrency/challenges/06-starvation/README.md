# 06 · Starvation: keeping the event loop turning

**Skills:** recognising starvation, event loop blocking, cooperative
multitasking, yielding with `setImmediate`, and microtask vs macrotask
yields.

## Background
**Starvation** is when a task is ready to run but never gets a turn, because
something else keeps the resource. Some ways it happens:
- one task hogs a single thread (here, the event loop)
- a lock lets newcomers jump the queue, so one waiter loses every time.
  That's why challenge 01's mutex was FIFO.
- a scheduler always prefers high-priority work, so low-priority jobs wait
  forever.

The event loop is **cooperative**: a callback runs until it returns or
`await`s. A long synchronous loop, even inside an `async` function, starves
everything else: timers, incoming requests, health checks. Kubernetes then
decides your pod is dead.

The fix is to **yield**, doing the work in chunks and handing control back
between them:
```js
const yieldToEventLoop = () => new Promise((resolve) => setImmediate(resolve));
```
It has to be a **macrotask** yield (`setImmediate`, `setTimeout`).
`await Promise.resolve()` and `process.nextTick` only yield to other
*microtasks*, which all run before timers and I/O get a turn.

(For really heavy CPU work, move it to a worker thread (challenge 05).
Chunking is for "a bit too long", not "seconds of maths".)

## Scenario
`npm start` builds a report of 300,000 rows while a 10ms heartbeat timer
runs. The heartbeat goes silent for the whole build.

## Goal
1. Change `buildReport` in `report.js` to process the rows in chunks (a few
   thousand at a time) and yield to the event loop between chunks. The result
   must stay identical. `npm start` should say "responsive".
2. In `answers.json`:
   - **q1**: why doesn't `await Promise.resolve()` between chunks fix it?
     a) it's too slow
     b) microtasks all run before the event loop moves on to timers and I/O,
        so they still never get a turn
     c) it does fix it
   - **q2**: a job queue always runs the highest-priority job first, and
     high-priority jobs keep arriving. Which change stops low-priority jobs
     starving?
     a) more worker threads
     b) a bigger queue
     c) **aging**: raise a job's priority the longer it waits

## Hints
- Try the `Promise.resolve()` version first and watch `npm start`. Seeing it
  fail makes q1 obvious.
- Yielding on every row works, but it's slow, because every turn of the loop
  has overhead. Chunk it with `if (i % 5000 === 0) await yieldToEventLoop();`.
- The validator sizes the job to your machine and allows a 75ms gap at most.

## Check your work
```
./onboard validate concurrency/06
```
