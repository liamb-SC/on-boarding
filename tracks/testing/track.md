# Track: Testing

Small hands-on tours of the testing tools you'll meet day to day: unit tests
with Jest and Vitest, browser end-to-end tests with Playwright, API tests with
Postman/newman, poking APIs from the terminal with HTTPie, and reading and
sanitising HAR files.

The validators don't just check that your tests pass. They plant small bugs in
the code (or the API) and check that your tests **fail**, because a test that
can't fail isn't testing anything.

## Requirements
- Node.js 20+ and network access to the npm registry.
- Challenge 03 downloads a Chromium build for Playwright (~150 MB, once). On a
  fresh Linux/WSL machine you may also need `sudo npx playwright install-deps chromium`.
- Challenge 05 needs HTTPie: `pipx install httpie` (or `pip install --user httpie`,
  or `brew install httpie`).
- Challenge 06 needs a browser with DevTools, or Playwright's
  `npx playwright open --save-har`.

## Learning objectives
By the end you can:
- Write focused unit tests with `describe`/`test`/`expect` and the common matchers.
- Replace collaborators with mocks (`jest.fn`, `vi.fn`), program them, and assert on their calls.
- Mock a whole ES module with `vi.mock`, and say how Vitest differs from Jest.
- Write e2e tests with role-based locators and auto-waiting assertions.
- Build a Postman collection that chains requests with variables, and run it with newman.
- Send query parameters, JSON, raw JSON, headers, forms and auth with HTTPie.
- Find slow, failed and large requests in a HAR, and sanitise one before sharing it.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | jest-unit-and-mocks | `expect` matchers, `toThrow`, `rejects`, `jest.fn`, `mockResolvedValue`, `toHaveBeenCalledWith` |
| 02 | vitest-esm | Vitest vs Jest, `vi.fn`, `mockRejectedValueOnce`, `vi.mock` for ES modules |
| 03 | playwright-e2e | `getByRole`/`getByLabel`, `fill`/`check`/`click`, `toHaveText`/`toHaveCount`, `webServer`, UI mode |
| 04 | postman-newman | collection v2.1, `{{baseUrl}}`, `pm.test`, chaining with `pm.collectionVariables`, `newman run` |
| 05 | httpie | `==` / `=` / `:=` / `:` request items, `--form`, `-A bearer`, `-v` |
| 06 | har-files | HAR structure and timings, recording a HAR, redacting tokens, cookies and passwords |

Challenges 04–06 share a tiny notes API (`notes-api.mjs`, `npm start` on `:5055`).

Start with: `./onboard start testing/01`
