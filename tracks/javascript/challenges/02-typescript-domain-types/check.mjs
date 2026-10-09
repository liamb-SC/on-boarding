import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { tsc, typeTests } from '../../ts-checks.mjs';

watchdog(60000);
const src = (f) => readFileSync(path.join(SANDBOX, 'src', f), 'utf8');
const noComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

await check('`npm run typecheck` passes with strict mode on', () => {
  const { ok, output } = tsc('--noEmit');
  expect(ok, output.split('\n').slice(0, 2).join(' | '));
});

await check('tsconfig.json still has "strict": true', () => {
  const cfg = readFileSync(path.join(SANDBOX, 'tsconfig.json'), 'utf8');
  expect(/"strict"\s*:\s*true/.test(cfg), 'put "strict": true back');
});

await check('no `any` anywhere in src/', () => {
  for (const f of readdirSync(path.join(SANDBOX, 'src'))) {
    expect(!/\bany\b/.test(noComments(src(f))), `found \`any\` in src/${f}`);
  }
});

await check('brand casts only happen in src/parse.ts', () => {
  const cast = /\bas\s+(AccountId|UserId|EmailAddress|Money|Id\s*<|Brand\s*<)/;
  for (const f of readdirSync(path.join(SANDBOX, 'src')).filter((f) => f !== 'parse.ts')) {
    expect(!cast.test(noComments(src(f))), `src/${f} casts to a branded type: go through a parse function instead`);
  }
});

// Each snippet is compiled against your code; "rejects" ones must be type errors.
const header = `
import type { AccountId, Brand, EmailAddress, Id, Money, UserId } from '../../../src/types.js';
import { parseAccountId, parseEmail, parseMoney, parseUserId } from '../../../src/parse.js';
import { sendStatement, transferFunds } from '../../../src/statements.js';
import { assertNever, filterByType, type Debt, type DebtOfType } from '../../../src/debts.js';
declare const acct: AccountId; declare const acct2: AccountId; declare const user: UserId;
declare const email: EmailAddress; declare const money: Money; declare const debts: Debt[];
`;
const cases = [
  { desc: 'a branded AccountId can still be used as a string', code: `const s: string = acct; const n: number = money;` },
  { desc: 'a plain string is not an AccountId', error: true, code: `const a: AccountId = 'acc_1a2b3c4d';` },
  { desc: 'a plain number is not Money', error: true, code: `const m: Money = 500;` },
  { desc: 'a UserId is not an AccountId', error: true, code: `const a: AccountId = user;` },
  { desc: 'an EmailAddress is not a UserId', error: true, code: `const u: UserId = email;` },
  { desc: 'Id<E> is generic: Id<\'Order\'> is yet another type', error: true, code: `const o: Id<'Order'> = acct;` },
  { desc: 'Brand<T, B> is generic over the base type', code: `type Port = Brand<number, 'Port'>; const p = 8080 as Port; const n: number = p;` },
  { desc: 'Brand<T, B> brands differ by name', error: true, code: `type A = Brand<string, 'A'>; type B = Brand<string, 'B'>; const b: B = ('x' as A);` },
  { desc: 'parseAccountId returns a Result you must check first', error: true, code: `const a: AccountId = parseAccountId('acc_1a2b3c4d');` },
  { desc: 'after checking ok, parse results are branded', code: `const r = parseEmail('a@b.co'); if (r.ok) { const e: EmailAddress = r.value; }
const u = parseUserId('usr_12345678'); if (u.ok) { const x: UserId = u.value; }
const m = parseMoney(100); if (m.ok) { const x: Money = m.value; }` },
  { desc: 'sendStatement accepts (UserId, AccountId, EmailAddress)', code: `sendStatement(user, acct, email);` },
  { desc: 'sendStatement rejects swapped user and account', error: true, code: `sendStatement(acct, user, email);` },
  { desc: 'sendStatement rejects a raw string email', error: true, code: `sendStatement(user, acct, 'a@b.co');` },
  { desc: 'transferFunds takes branded ids and Money', code: `transferFunds({ from: acct, to: acct2, amount: money });` },
  { desc: 'transferFunds rejects a raw number amount', error: true, code: `transferFunds({ from: acct, to: acct2, amount: 500 });` },
  { desc: 'transferFunds rejects a UserId as the source', error: true, code: `transferFunds({ from: user, to: acct2, amount: money });` },
  { desc: 'DebtOfType<\'auto_loan\'> has the auto-loan fields', code: `const d = {} as DebtOfType<'auto_loan'>; const t: number = d.termLengthMonths; const v: string | undefined = d.vehicleVin;` },
  { desc: 'DebtOfType<\'mortgage\'> does not have credit-card fields', error: true, code: `const d = {} as DebtOfType<'mortgage'>; d.creditLimit;` },
  { desc: 'filterByType(debts, \'mortgage\') is typed as mortgages', code: `const m = filterByType(debts, 'mortgage'); const addr: string | undefined = m[0]?.propertyAddress;` },
  { desc: 'filterByType results are narrowed (no creditLimit on mortgages)', error: true, code: `filterByType(debts, 'mortgage')[0]?.creditLimit;` },
  { desc: 'filterByType rejects a type that does not exist', error: true, code: `filterByType(debts, 'boat');` },
  { desc: 'assertNever only accepts never', error: true, code: `assertNever('credit_card');` },
];
const { importError, results } = typeTests(header, cases);
await check('exports: Brand, Id and the branded types; parse functions; assertNever, DebtOfType, filterByType', () => {
  expect(!importError, importError);
});
for (const c of importError ? [] : cases) {
  await check(`types: ${c.desc}`, () => {
    const failure = results.get(c.desc);
    expect(failure === null, failure);
  });
}

await check('getDebtSummary has a default case that calls assertNever', () => {
  const body = noComments(src('debts.ts')).split(/function\s+getDebtSummary/)[1] ?? '';
  expect(/default\s*:[\s\S]*assertNever\s*\(\s*debt\s*\)/.test(body), 'add `default: return assertNever(debt);` to the switch');
});

// Runtime behaviour, from the compiled output.
rmSync(path.join(SANDBOX, 'dist'), { recursive: true, force: true });
const build = tsc();
let parse, debts;
await check('the project compiles to dist/', async () => {
  expect(build.ok, `tsc failed: ${build.output.split('\n')[0]}`);
  parse = await fromSandbox('./dist/parse.js');
  debts = await fromSandbox('./dist/debts.js');
});

const accepts = (fn, input, value) => {
  const r = parse[fn](input);
  expect(r?.ok === true, `${fn}(${JSON.stringify(input)}) should be ok, got ${JSON.stringify(r)}`);
  if (value !== undefined) expectEqual(r.value, value, `${fn}(${JSON.stringify(input)}).value: `);
};
const rejects = (fn, input) => {
  const r = parse[fn](input);
  expect(r?.ok === false && typeof r.error === 'string' && r.error.length > 0,
    `${fn}(${JSON.stringify(input).slice(0, 40)}) should be err('<reason>'), got ${JSON.stringify(r)?.slice(0, 80)}`);
};

if (parse) {
  await check('parseEmail trims, lowercases and accepts real addresses', () => {
    accepts('parseEmail', '  Alice@Example.com ', 'alice@example.com');
    accepts('parseEmail', 'bob.smith+loans@mail.co.uk', 'bob.smith+loans@mail.co.uk');
  });
  await check('parseEmail rejects "", "hello", "a@b", spaces and anything over 254 characters', () => {
    for (const bad of ['', '   ', 'hello', 'a@b', 'a b@c.com', '@example.com', `${'x'.repeat(250)}@example.com`]) rejects('parseEmail', bad);
  });
  await check('parseAccountId / parseUserId enforce acc_ / usr_ + 8 lowercase letters or digits', () => {
    accepts('parseAccountId', 'acc_1a2b3c4d', 'acc_1a2b3c4d');
    accepts('parseUserId', 'usr_9z8y7x6w', 'usr_9z8y7x6w');
    for (const bad of ['', 'acc_123', 'acc_1a2b3c4d5', 'ACC_1A2B3C4D', 'usr_1a2b3c4d', 'xacc_1a2b3c4d', 'acc_1a2b3c4d ']) rejects('parseAccountId', bad);
    for (const bad of ['acc_9z8y7x6w', 'usr_9z8y7x6', 'usr_9Z8Y7X6W']) rejects('parseUserId', bad);
  });
  await check('parseMoney accepts whole pence ≥ 0 and rejects -1, 1.5, NaN, Infinity', () => {
    accepts('parseMoney', 0, 0);
    accepts('parseMoney', 1999, 1999);
    for (const bad of [-1, 1.5, NaN, Infinity]) rejects('parseMoney', bad);
  });
}

if (debts) {
  const base = { lenderName: 'Lender', originalBalance: 1000, remainingBalance: 500, interestRate: 5, minimumMonthlyPayment: 50, dueDate: new Date() };
  const sample = [
    { ...base, id: '1', type: 'credit_card', creditLimit: 2000, isIntroductoryRateActive: false },
    { ...base, id: '2', type: 'mortgage', propertyAddress: '1 High St', termLengthYears: 25, mortgageType: 'fixed' },
    { ...base, id: '3', type: 'mortgage', propertyAddress: '2 Low Rd', termLengthYears: 30, mortgageType: 'variable' },
    { ...base, id: '4', type: 'auto_loan', termLengthMonths: 60 },
  ];
  await check('filterByType returns only the requested variant', () => {
    expectEqual(debts.filterByType(sample, 'mortgage').map((d) => d.id), ['2', '3'], 'mortgages: ');
    expectEqual(debts.filterByType(sample, 'student_loan'), [], 'student loans: ');
  });
  await check('assertNever throws, and getDebtSummary throws on an unknown debt type', () => {
    let threw = false;
    try { debts.assertNever('surprise'); } catch { threw = true; }
    expect(threw, 'assertNever should throw');
    threw = false;
    try { debts.getDebtSummary({ ...base, id: '9', type: 'payday_loan' }); } catch { threw = true; }
    expect(threw, 'getDebtSummary returned something for a type it doesn\'t know: let the default case throw');
    expect(debts.getDebtSummary(sample[1]).startsWith('FIXED Mortgage for 1 High St'), 'known types still summarise');
  });
}

await check('npm start prints the statement with user, account and email the right way round', () => {
  expect(build.ok, 'fix the compile errors first');
  const out = execFileSync(process.execPath, ['dist/main.js'], { cwd: SANDBOX, encoding: 'utf8' }).trim();
  expectEqual(out, 'Statement for acc_1a2b3c4d sent to usr_9z8y7x6w at alice@example.com');
});
