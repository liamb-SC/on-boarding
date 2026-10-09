import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, SANDBOX } from '../../../../lib/checks.mjs';

const read = (rel) => {
  const f = path.join(SANDBOX, rel);
  return existsSync(f) ? readFileSync(f, 'utf8') : '';
};
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const SECRET = 'pay_live_';

// ---------- CLAUDE.md: the project context an agent loads every session ----------
const ctx = read('CLAUDE.md');
const lc = ctx.toLowerCase();
const lines = ctx.split('\n');

await check('CLAUDE.md exists at the project root', () => expect(ctx.trim(), 'create CLAUDE.md'));

await check('CLAUDE.md is concise: 60 words or more, 60 lines or fewer', () => {
  expect(words(ctx) >= 60, `${words(ctx)} words. Say enough to be useful`);
  expect(lines.length <= 60, `${lines.length} lines. Every line costs context in every session`);
});

await check('it gives the exact commands to test, lint and regenerate code', () => {
  for (const cmd of ['npm test', 'npm run lint', 'npm run codegen']) expect(ctx.includes(cmd), `missing \`${cmd}\``);
});

await check('it says src/generated/ must not be edited by hand', () => {
  const ls = lines.filter((x) => /src\/generated/i.test(x));
  expect(ls.length, 'mention src/generated/');
  expect(ls.some((l) => /(do not|don't|never|must not|no hand)/i.test(l)), 'on the same line, say not to edit it (and how to regenerate it)');
});

await check('it records the money convention: integer pence, never floats', () =>
  expect(/pence/.test(lc) && /(integer|int\b|whole)/.test(lc), 'which unit, and what type?'));

await check('it records the discount rounding rule (in the customer\'s favour)', () =>
  expect(/(customer'?s favou?r|round(ed|ing)? down|floor)/.test(lc)));

await check('no secrets in CLAUDE.md', () => expect(!ctx.includes(SECRET), 'never paste .env values into context files'));

// ---------- prompts/fix-rounding.md: a task prompt someone else could run ----------
const p = read('prompts/fix-rounding.md');
const pl = p.toLowerCase();

await check('the prompt is rewritten (40+ words, not just "the totals are wrong")', () =>
  expect(words(p) >= 40, `${words(p)} words`));

await check('it points at the code and the failing test by name', () => {
  expect(pl.includes('src/basket.js'), 'name the file: src/basket.js');
  expect(/customer'?s favou?r/.test(pl), 'name the failing test');
});

await check('it gives expected vs actual (1795 vs 1796)', () =>
  expect(p.includes('1795') && p.includes('1796'), 'run npm test and copy the numbers'));

await check('it says how to verify (npm test) and sets a constraint (don\'t change the tests)', () => {
  expect(pl.includes('npm test'), 'tell it how to check its work');
  expect(/(do not|don't|never|must not|without)[^.\n]{0,40}(test)/.test(pl), 'say what it must not touch');
});

await check('no secrets in the prompt', () => expect(!p.includes(SECRET)));
