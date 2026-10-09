import { readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { tsc, typeTests } from '../../ts-checks.mjs';

watchdog(60000);
const src = (f) => readFileSync(path.join(SANDBOX, 'src', f), 'utf8');

await check('`npm run typecheck` passes with strict mode on', () => {
  const { ok, output } = tsc('--noEmit');
  expect(ok, output.split('\n').slice(0, 2).join(' | '));
});

await check('src/orders.ts has no `any` (explicit or as-cast)', () => {
  const code = src('orders.ts').replace(/\/\/.*$/gm, '');
  expect(!/\bany\b/.test(code), 'found `any`: describe the real shape instead');
});

await check('tsconfig.json still has "strict": true', () => {
  const cfg = readFileSync(path.join(SANDBOX, 'tsconfig.json'), 'utf8');
  expect(/"strict"\s*:\s*true/.test(cfg), 'put "strict": true back');
});

// The types must accept good data and reject bad data. Each snippet below is
// compiled against your orders.ts; "rejects" ones must be type errors.
const header = `
import { first, groupBy, orderTotal, type LineItem, type Order, type OrderStatus } from '../../../src/orders.js';
const ok: Order = { id: '1', customer: 'ada', status: 'paid', items: [{ sku: 'mug', qty: 1, unitPrice: 2 }] };
`;
const cases = [
  { desc: 'Order accepts a well-formed order', code: `const o: Order = ok; const i: LineItem = ok.items[0]!; const s: OrderStatus = 'shipped';` },
  { desc: 'OrderStatus only allows pending | paid | shipped', error: true, code: `const s: OrderStatus = 'lost';` },
  { desc: 'Order rejects an unknown status', error: true, code: `const o: Order = { ...ok, status: 'refunded' };` },
  { desc: 'Order requires items', error: true, code: `const o: Order = { id: '1', customer: 'ada', status: 'paid' };` },
  { desc: 'LineItem.qty must be a number', error: true, code: `const i: LineItem = { sku: 'mug', qty: '1', unitPrice: 2 };` },
  { desc: 'orderTotal takes an Order and returns a number', code: `const n: number = orderTotal(ok);` },
  { desc: 'orderTotal rejects something that is not an Order', error: true, code: `orderTotal({ items: 'nope' });` },
  { desc: 'first() is generic: first of numbers is number | undefined', code: `const n: number | undefined = first([1, 2, 3]);` },
  { desc: 'first() keeps the element type (not unknown / any)', error: true, code: `const s: string | undefined = first([1, 2, 3]);` },
  { desc: 'first() admits it can return undefined', error: true, code: `const n: number = first([1, 2, 3]);` },
  { desc: 'groupBy() is generic: groups of Orders are Order[]', code: `const g = groupBy([ok], (o) => o.status); const os: Order[] = g['paid'] ?? [];` },
  { desc: 'groupBy() keeps the element type in its groups', error: true, code: `const g = groupBy([ok], (o) => o.status); const s: string[] = g['paid'] ?? [];` },
  { desc: 'groupBy() types the key callback\'s parameter', error: true, code: `groupBy([ok], (o) => o.nope);` },
];
const { importError, results } = typeTests(header, cases);
await check('src/orders.ts exports OrderStatus, LineItem, Order, orderTotal, first and groupBy', () => {
  expect(!importError, importError);
});
for (const c of importError ? [] : cases) {
  await check(`types: ${c.desc}`, () => {
    const failure = results.get(c.desc);
    expect(failure === null, failure);
  });
}

await check('the compiled code still works (orderTotal, first, groupBy)', async () => {
  rmSync(path.join(SANDBOX, 'dist'), { recursive: true, force: true });
  const { ok, output } = tsc();
  expect(ok, `tsc failed: ${output.split('\n')[0]}`);
  const m = await fromSandbox('./dist/orders.js');
  const order = { id: '1', customer: 'a', status: 'paid', items: [{ sku: 'a', qty: 2, unitPrice: 8 }, { sku: 'b', qty: 1, unitPrice: 5 }] };
  expectEqual(m.orderTotal(order), 21, 'orderTotal: ');
  expectEqual(m.first(['x', 'y']), 'x', 'first: ');
  expectEqual(m.first([]), undefined, 'first([]): ');
  expectEqual(m.groupBy([1, 2, 3, 4], (n) => (n % 2 ? 'odd' : 'even')), { odd: [1, 3], even: [2, 4] }, 'groupBy: ');
});
