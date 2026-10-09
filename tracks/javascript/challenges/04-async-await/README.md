# 04 · async/await, Promise.all and the event loop

**Skills:** promises, `async`/`await`, `Promise.all`, `Promise.allSettled`,
`try/catch` with `await`, and the order the event loop runs callbacks in.

## Background
- An `async` function always returns a **Promise**. `await p` pauses that
  function, **not** the whole process, until `p` settles.
- `await` one at a time when step 2 needs step 1's result. When the calls are
  independent, start them all and wait once:
  ```js
  const [a, b] = await Promise.all([getA(), getB()]);  // ~1 round trip, not 2
  ```
  `Promise.all` rejects as soon as **any** promise rejects.
  `Promise.allSettled` waits for all of them and tells you how each one went:
  `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }`.
- `try/catch` only catches a rejection that you **await** inside the `try`.
  `return promise` inside a `try` hands the promise back unawaited, so the
  `catch` never sees it fail. Write `return await promise` instead.
- **Event loop.** Node runs your synchronous code to the end first. Then it
  drains the `process.nextTick` queue, then the **microtasks** (promise
  callbacks, code after `await`, `queueMicrotask`), and only then moves on to
  **macrotasks** such as timers (`setTimeout`), I/O callbacks and
  `setImmediate`.

## Scenario
`dashboard.js` loads data from a slow API (`api.js`, ~50ms per call).
`npm start` shows it's slow, `loadMany` falls over on one bad id, and
`safeLoad` doesn't catch what it should.

## Goal
1. `loadDashboard`: run the two calls **in parallel**.
2. `loadMany`: fetch every user **in parallel** and report each one as
   `{ id, ok: true, user }` or `{ id, ok: false, error: err.message }`, in the
   order of `ids`.
3. `safeLoad`: return `null` only for a `NotFoundError`. Any other error must
   still reject.
4. Event loop: **without running it first**, predict the order of the letters
   `event-loop.cjs` prints. Write them in `event-loop.answer.txt`, one per
   line. Then run it and fix your answer if needed. Make sure you can explain
   every position.

## Hints
- `ids.map((id) => getUser(id))` starts every call at once and gives you an
  array of promises.
- `err instanceof NotFoundError` tells "not found" apart from "broken".
- For the event loop, label each line as sync, nextTick, microtask or timer.
  `F` is a trap: an async function runs synchronously until its first `await`.

## Check your work
```
./onboard validate javascript/04
```
