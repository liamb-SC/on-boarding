# 02 · Vitest: the same idea, native ESM

**Skills:** Vitest's Jest-compatible API, `vi.fn()`, `mockResolvedValue`,
`mockRejectedValueOnce`, mocking an ES module with `vi.mock`, `vitest run` vs
watch mode.

## Background
Vitest runs the same kind of tests as Jest (`describe`, `test`, `expect`,
matchers), but it's built on Vite, so ES modules and TypeScript just work, with
no Babel and no config. The mocking helpers live on `vi` instead of `jest`:

| Jest | Vitest |
|------|--------|
| `jest.fn()` | `vi.fn()` |
| `jest.mock('./x')` | `vi.mock('./x.js')` |
| `jest.useFakeTimers()` | `vi.useFakeTimers()` |

You import the helpers explicitly: `import { test, expect, vi } from 'vitest'`.

**Mocking a whole module.** `vi.mock('../src/http.js')` replaces every export
of that module with a `vi.fn()`, everywhere it's imported, for this test file.
Vitest hoists the call above your imports, so you can then import the mocked
function and program it:

```js
import { vi } from 'vitest';
import { getJson } from '../src/http.js';
vi.mock('../src/http.js');

getJson.mockResolvedValue({ tempC: 11.6 });
```

A chained mock returns different things on each call:
`vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue('ok')`.

## Scenario
`src/retry.js` retries a flaky async function. `src/weather.js` uses it to
fetch a temperature through `src/http.js`, which calls the real network. Read
the comments in each file. There's one example test.

## Goal
Write at least 7 tests in `test/retry.test.js` and `test/weather.test.js`:

1. `retry`: succeeds first time (given). Fails twice, then succeeds: the result
   comes back and `fn` was called 3 times. Every attempt fails: the **last**
   error is thrown after exactly `attempts` calls. `onRetry` is called with
   `(error, attemptNumber)` before each retry, and **not** after the final
   failure.
2. `currentTemp`, with `src/http.js` mocked via `vi.mock`: it returns the
   temperature rounded to the **nearest** degree (`11.6` gives `12`), it calls
   `getJson` with the city URL-encoded (`'São Paulo'` becomes `S%C3%A3o%20Paulo`),
   and it survives one failed request (it retries).

The validator plants small bugs in the source, one at a time, and expects your
tests to catch every one.

## Hints
- `npm run test:watch` reruns on every save. Press `h` for options.
- `expect(getJson).toHaveBeenCalledWith(expect.stringContaining('city=S%C3%A3o'))`
- `vi.mocked(getJson)` gives you the mock with proper typings, which helps in TS.
- Call `vi.resetAllMocks()` in a `beforeEach` so tests don't leak into each other.

## Check your work
```
./onboard validate testing/02
```
