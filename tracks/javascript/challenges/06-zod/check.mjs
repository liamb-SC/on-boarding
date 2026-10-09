import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { tsc, typeTests } from '../../ts-checks.mjs';

watchdog(60000);
const code = readFileSync(path.join(SANDBOX, 'src/signup.ts'), 'utf8').replace(/\/\/.*$/gm, '');

await check('`npm run typecheck` passes', () => {
  const { ok, output } = tsc('--noEmit');
  expect(ok, output.split('\n').slice(0, 2).join(' | '));
});

await check('Signup is inferred from the schema (z.infer), not written by hand', () => {
  expect(!/interface\s+Signup\b/.test(code), 'delete the hand-written interface');
  expect(/type\s+Signup\s*=\s*z\.(infer|output)\s*<\s*typeof\s+SignupSchema\s*>/.test(code),
    'export type Signup = z.infer<typeof SignupSchema>');
});

// The inferred type must say exactly what the schema says.
const header = `
import { parseSignup, SignupSchema, type Signup } from '../../../src/signup.js';
const base = { email: 'a@b.co', password: '12345678', plan: 'free' as const };
`;
const cases = [
  { desc: 'Signup accepts email + password + plan', code: `const s: Signup = base;` },
  { desc: 'Signup accepts an optional numeric age', code: `const s: Signup = { ...base, age: 30 }; const a: number | undefined = s.age;` },
  { desc: 'Signup.plan is required after parsing (the default fills it)', code: `const p: 'free' | 'pro' = ({} as Signup).plan;` },
  { desc: 'Signup rejects a missing password', error: true, code: `const s: Signup = { email: 'a@b.co', plan: 'free' };` },
  { desc: 'Signup rejects a plan that is not free | pro', error: true, code: `const s: Signup = { ...base, plan: 'enterprise' };` },
  { desc: 'Signup rejects a string age', error: true, code: `const s: Signup = { ...base, age: '30' };` },
  { desc: 'parseSignup narrows: data on ok, errors otherwise', code: `const r = parseSignup({}); if (r.ok) { const e: string = r.data.email; } else { const errs: string[] = r.errors; }` },
  { desc: 'parseSignup has no data when not ok', error: true, code: `const r = parseSignup({}); if (!r.ok) { r.data; }` },
];
const { importError, results } = typeTests(header, cases);
await check('src/signup.ts exports SignupSchema, type Signup and parseSignup', () => expect(!importError, importError));
for (const c of importError ? [] : cases) {
  await check(`types: ${c.desc}`, () => {
    const failure = results.get(c.desc);
    expect(failure === null, failure);
  });
}

rmSync(path.join(SANDBOX, 'dist'), { recursive: true, force: true });
const built = tsc();
let m;
const loaded = await check('the project compiles and src/signup.ts exports a zod SignupSchema', async () => {
  expect(built.ok, `tsc failed: ${built.output.split('\n')[0]}`);
  m = await fromSandbox('./dist/signup.js');
  expect(typeof m.SignupSchema?.safeParse === 'function', 'SignupSchema is not a zod schema');
});

const good = { email: 'ada@example.com', password: 'correct horse' };
const parse = (v) => m.SignupSchema.safeParse(v);

if (loaded) await check('SignupSchema accepts a valid signup and defaults plan to "free"', () => {
  const r = parse(good);
  expect(r.success, `rejected: ${r.error?.issues?.map((i) => i.path.join('.') + ' ' + i.message).join('; ')}`);
  expectEqual(r.data, { ...good, plan: 'free' });
  expectEqual(parse({ ...good, age: 13, plan: 'pro' }).data, { ...good, age: 13, plan: 'pro' });
});

if (loaded) await check('SignupSchema strips unknown keys (e.g. isAdmin) from the result', () => {
  expectEqual(parse({ ...good, isAdmin: true }).data, { ...good, plan: 'free' });
});

for (const [desc, input] of loaded ? [
  ['an invalid email', { ...good, email: 'ada.example.com' }],
  ['a password shorter than 8 characters', { ...good, password: 'short' }],
  ['an age under 13', { ...good, age: 12 }],
  ['a non-integer age', { ...good, age: 20.5 }],
  ['an unknown plan', { ...good, plan: 'enterprise' }],
  ['a missing email', { password: 'correct horse' }],
  ['something that is not an object', 'hello'],
] : []) {
  await check(`SignupSchema rejects ${desc}`, () => expect(!parse(input).success, 'it was accepted'));
}

if (built.ok) await check('parseSignup returns { ok: true, data } for good input', () => {
  expectEqual(m.parseSignup(good), { ok: true, data: { ...good, plan: 'free' } });
});

if (built.ok) await check('parseSignup returns { ok: false, errors } naming each bad field, and never throws', () => {
  const r = m.parseSignup({ email: 'nope', password: 'short', age: 9, plan: 'free' });
  expect(r.ok === false, 'expected ok: false');
  expectEqual([...new Set(r.errors)].sort(), ['age', 'email', 'password'], 'errors: ');
});
