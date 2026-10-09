# 04 · async/await pitfalls

**Skills:** `forEach` with async callbacks, accidentally sequential awaits,
`return` vs `return await` in `try`, floating promises and unhandled
rejections, and forgetting `await` in a condition.

## Background
`await` makes async code read like sync code, and that's exactly how bugs
slip in, because the code looks right:

| Pitfall | Why it bites |
|---------|--------------|
| `items.forEach(async (x) => await save(x))` | `forEach` ignores the promises your callback returns. Nothing waits for them, and their errors go nowhere. |
| `for (...) results.push(await load(id))` | Each load waits for the previous one. Five independent 50ms calls take 250ms. |
| `try { return load(); } catch {}` | The promise is returned before it settles, so the `catch` never runs. |
| `sync();` with no `await` or `.catch` | A **floating promise**. If it rejects, it's an *unhandled rejection*, which crashes Node by default. |
| `if (isAdmin(user))` | A Promise is an object, and objects are always truthy. |

Fixes: `for...of` with `await` (in order) or `Promise.all(items.map(...))`
(parallel). Use `return await` inside `try`. Every promise you don't await
needs a `.catch()`.

## Scenario
`pitfalls.js` has five helpers, each with one of the bugs above. `npm start`
shows the symptoms.

## Goal
Fix all five functions in `pitfalls.js` so they do what their comments say.
`npm start` should then match every "expected" note.

## Hints
- (1) and (2) can both be one-line `Promise.all` fixes.
- (4) should **not** become `async`. The caller doesn't want to wait.
  `sync().catch(onError)`.
- ESLint's `@typescript-eslint/no-floating-promises` and
  `no-misused-promises` rules catch several of these automatically in
  TypeScript projects.

## Check your work
```
./onboard validate concurrency/04
```
