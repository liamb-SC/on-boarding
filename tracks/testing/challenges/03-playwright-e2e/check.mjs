import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { run, tail, withCopy } from '../../mutants.mjs';

watchdog(300000);
const here = path.dirname(fileURLToPath(import.meta.url));
// Always test against the original app and config, even if the learner edited theirs.
const original = Object.fromEntries(['public/app.js', 'public/index.html', 'server.mjs', 'playwright.config.js']
  .map((f) => [f, readFileSync(path.join(here, 'starter', f), 'utf8')]));
const specFile = path.join(SANDBOX, 'tests/todo.spec.js');
const spec = (existsSync(specFile) ? readFileSync(specFile, 'utf8') : '')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const freePort = () => new Promise((resolve) => {
  const s = createServer().listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

// Run the learner's specs against `files` on a free port; CI=1 so Playwright
// starts its own server rather than reusing one the learner left running.
const playwright = async (files) => {
  const port = await freePort();
  return withCopy(files, (dir) =>
    run('node', ['node_modules/@playwright/test/cli.js', 'test', '--reporter=json', '--workers=2'], {
      cwd: dir, timeout: 120000, env: { PORT: String(port), PLAYWRIGHT_JSON_OUTPUT_NAME: '.pw.json' },
    }).then((r) => {
      let json = null;
      try { json = JSON.parse(readFileSync(path.join(dir, '.pw.json'), 'utf8')); } catch {}
      return { ...r, json };
    }));
};

// One small, plausible bug each in app.js. Good e2e tests fail on every one.
const mutants = [
  ['the counter says "1 items left"', "left === 1 ? 'item' : 'items'", "'items'"],
  ['ticking a todo off does not update the counter', 'todos.filter((t) => !t.done).length', 'todos.length'],
  ['blank todos get added', 'if (text) todos.push', 'todos.push'],
  ['the Completed filter shows everything', "(filter === 'active' ? !t.done : t.done)", "(filter === 'active' ? !t.done : true)"],
  ['the Active filter shows everything', "(filter === 'active' ? !t.done : t.done)", "(filter === 'active' ? true : t.done)"],
  ['adding a todo replaces the whole list', 'todos.push({ id: todos.length + 1, text, done: false })', 'todos.splice(0, todos.length, { id: 1, text, done: false })'],
  ['the input is not cleared after adding', "  input.value = '';\n", ''],
];

let real;
await check('tests/todo.spec.js exists', () => expect(spec, 'write your tests in tests/todo.spec.js'));

await check('your tests pass against the real app in Chromium', async () => {
  real = await playwright(original);
  const errors = real.json?.errors?.map((e) => e.message.split('\n')[0]) ?? [];
  expect(real.json, `playwright did not run: ${tail(real.out)}`);
  expect(!/Executable doesn't exist|install/.test(errors.join(' ')), 'Chromium is missing: run `npx playwright install chromium`');
  expect(real.code === 0, `failing: ${errors[0] ?? tail(real.out)}`);
});

await check('there are at least 4 tests', () => {
  const n = real?.json?.stats?.expected ?? 0;
  expect(n >= 4, `found ${n} passing`);
});

await check('tests use user-facing locators (getByRole / getByLabel / getByText)', () =>
  expect(/getBy(Role|Label|Text|Placeholder)\s*\(/.test(spec), 'prefer page.getByRole(...) and page.getByLabel(...) over CSS selectors'));

await check('tests use auto-waiting assertions (await expect(locator).toHave...)', () =>
  expect(/\.toHave(Text|Count|Value|Class|Attribute)\s*\(|\.toBe(Visible|Checked|Hidden)\s*\(/.test(spec),
    'e.g. await expect(page.getByRole("listitem")).toHaveCount(2)'));

// The mutants are independent, so run them side by side (each on its own port).
const results = real?.code === 0
  ? await Promise.all(mutants.map(([, from, to]) =>
    (original['public/app.js'].includes(from)
      ? playwright({ ...original, 'public/app.js': original['public/app.js'].replace(from, to) })
      : { code: 0, internal: true })))
  : [];

for (const [i, [desc]] of mutants.entries()) {
  await check(`your tests catch the bug: ${desc}`, () => {
    expect(real?.code === 0, 'make your tests pass against the real app first');
    expect(!results[i].internal, 'internal: mutant does not apply');
    expect(results[i].code !== 0, 'every test still passed with this bug in app.js');
  });
}
