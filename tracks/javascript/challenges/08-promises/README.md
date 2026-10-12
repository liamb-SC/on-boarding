# 08 · Promises in depth

**Skills:** `new Promise`, turning callbacks into promises, `.then`/`.catch`
chaining, `Promise.race` vs `Promise.any`, timeouts, retries and cleaning up
timers.

## Background
- A promise is **pending** until it settles once, either **fulfilled** with a
  value or **rejected** with a reason. After that it never changes.
- `new Promise((resolve, reject) => { ... })` wraps callback-style code. You
  have to call `reject` yourself. If you don't, an error turns into a
  successful `undefined`.
- `.then(f)` and `.catch(f)` return a **new** promise, which settles with
  whatever `f` returns. If `f` returns a promise, the chain waits for it. If
  `f` forgets to `return`, the chain carries on straight away with
  `undefined`. This is the most common promise bug.
- `Promise.race` settles like the **first** promise to settle, whether it
  fulfils or rejects. `Promise.any` fulfils with the first **success**, and
  rejects with an `AggregateError` only if they all fail.
- A pending `setTimeout` keeps Node running. If you add a timer to a promise,
  clear it when you're done: `promise.finally(() => clearTimeout(timer))`.

## Scenario
`promises.js` has four small helpers that our services lean on. Each one has a
bug. Run `npm start` to see the symptoms: errors come back as `undefined`,
retries "succeed" with nothing and leave unhandled rejections behind, a
broken mirror sinks the download, and the script sits there for 3 seconds
before it exits.

## Goal
Fix each function in `promises.js` so it does what its comment says:
1. `readConfigAsync`: reject when the callback gets an error.
2. `retry`: wait `delayMs`, then try again, and pass the retry's result back
   down the chain.
3. `withTimeout`: keep the `TimeoutError` behaviour, but clear the timer once
   the promise settles, whether it fulfilled or rejected.
4. `firstAvailable`: resolve with the first mirror that **works**.

When you're done, every "expected" note in `main.js` should match, and
`npm start` should exit straight away.

## Hints
- (1) `if (err) reject(err); else resolve(config);`. Node's
  `util.promisify(readConfig)` does the same thing, but write it by hand once.
- (2) Make a `delay(ms)` helper that returns a promise, then `return
  delay(delayMs).then(() => retry(...))` inside the `.catch`. An
  `async`/`await` loop works too.
- (3) Keep the timer id from `setTimeout` so you can clear it later.
- (4) This is a one-word fix.

## Check your work
```
./onboard validate javascript/08
```
