# 03 · Playwright: end-to-end tests in a real browser

**Skills:** `@playwright/test`, `page.goto`, role-based locators
(`getByRole`, `getByLabel`), actions (`fill`, `press`, `click`, `check`),
auto-waiting assertions, `webServer`, traces and UI mode.

## Background
Unit tests check functions. **End-to-end (e2e) tests** check what a user
actually sees: a real browser loads the real page, and the test clicks and
types like a person would.

```js
test('adds a todo', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('What needs doing?').fill('Buy milk');
  await page.getByLabel('What needs doing?').press('Enter');
  await expect(page.getByRole('listitem')).toHaveText(['Buy milk']);
});
```

- **Locators** find elements the way a user would: by role and accessible
  name (`getByRole('checkbox', { name: 'Buy milk' })`), by label, or by text.
  These survive refactors much better than CSS selectors do.
- **Web-first assertions** like `await expect(locator).toHaveText(...)` retry
  until they pass or time out, so you never need `sleep`.
- `webServer` in `playwright.config.js` starts the app before the tests run.

## Scenario
`public/` is a small todo app. You can add todos, tick them off, and filter by
All / Active / Completed. `tests/todo.spec.js` has one test. Run it with
`npm test`.

## Goal
Write at least 4 tests that pin down this behaviour:

1. Adding "Buy milk" then "Walk dog" shows **both**, in that order, says
   `2 items left`, and **clears the input**.
2. Ticking one off changes the counter to `1 item left` (singular).
3. **Active** shows only unfinished todos. **Completed** shows only finished ones.
4. Submitting an empty or whitespace-only todo adds nothing.

The validator runs your tests against the real app, then against copies with
small bugs planted in `app.js`, and expects your tests to catch every one.

## Hints
- `npm run test:ui` opens UI mode, where you can watch each step and pick
  locators. `npx playwright codegen localhost:4173` records your clicks as code
  (run `npm start` first).
- Checkboxes have the todo's text as their label:
  `page.getByRole('checkbox', { name: 'Walk dog' }).check()`.
- Filters are links: `page.getByRole('link', { name: 'Completed' })`.
- `toHaveText([...])` on a list locator checks every item, in order.
- `expect(page.getByLabel('What needs doing?')).toHaveValue('')`.
- Missing browser? `npx playwright install chromium`. On a fresh Linux/WSL
  machine you may also need `sudo npx playwright install-deps chromium`.

## Check your work
```
./onboard validate testing/03
```
