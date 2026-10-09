import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, stage, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const ref = stage(path.join(path.dirname(fileURLToPath(import.meta.url)), 'starter'), 'dynamodb');
const { createTable } = await fromSandbox(`${ref}/table.js`);
const data = await fromSandbox(`${ref}/data.js`);
const { customerItem, orderItem, lineItemItem, queries } = await fromSandbox('./keys.js');

// Extra entities the learner hasn't seen, so hard-coded answers don't pass.
const extra = {
  customers: [{ customerId: 'c3', name: 'Linus', email: 'linus@example.com' }],
  orders: [
    { orderId: 'o5', customerId: 'c3', createdAt: '2024-04-02T10:00:00Z', status: 'PENDING', total: 5 },
    { orderId: 'o6', customerId: 'c3', createdAt: '2023-12-24T18:00:00Z', status: 'CANCELLED', total: 70 },
  ],
  lineItems: [{ orderId: 'o5', sku: 'STICKER', qty: 5, price: 1 }],
};

function load(sets) {
  const table = createTable();
  for (const s of sets) {
    s.customers.forEach((c) => table.put(customerItem(c)));
    s.orders.forEach((o) => table.put(orderItem(o)));
    s.lineItems.forEach((l) => table.put(lineItemItem(l)));
  }
  return table;
}

let table;
await check('every item gets a non-empty PK and SK, and no two items collide', () => {
  table = load([data, extra]);
});
table ??= createTable();

await check('items keep the entity\'s own attributes', () => {
  const o = orderItem(data.orders[0]);
  expect(o.orderId === 'o1' && o.total === 40 && o.status === 'SHIPPED', 'spread the entity into the item: { ...order, PK, SK }');
});

const q = (params, label) => {
  expect(params && typeof params.pk === 'string' && params.pk, `${label} returned no pk`);
  return table.query(params);
};
const ids = (rows, key) => rows.map((r) => r[key] ?? `(not a ${key} item: ${r.PK}/${r.SK})`);

await check('getCustomer: returns exactly the profile item', () => {
  for (const c of ['c1', 'c3']) {
    const rows = q(queries.getCustomer(c), 'getCustomer');
    expect(rows.length === 1 && rows[0].customerId === c && rows[0].orderId === undefined,
      `getCustomer('${c}') returned ${rows.length} items: ${JSON.stringify(rows.map((r) => [r.PK, r.SK]))}`);
  }
});

await check('ordersForCustomer: only that customer\'s orders, newest first', () => {
  expectEqual(ids(q(queries.ordersForCustomer('c1'), 'ordersForCustomer'), 'orderId'), ['o2', 'o3', 'o1'], "c1: ");
  expectEqual(ids(q(queries.ordersForCustomer('c3'), 'ordersForCustomer'), 'orderId'), ['o5', 'o6'], "c3: ");
});

await check('lineItemsForOrder: exactly the order\'s line items', () => {
  const skus = (o) => ids(q(queries.lineItemsForOrder(o), 'lineItemsForOrder'), 'sku').sort();
  expectEqual(skus('o3'), ['HOODIE', 'TEE-RED'], 'o3: ');
  expectEqual(skus('o5'), ['STICKER'], 'o5: ');
});

await check('ordersByStatus: uses the GSI (index: "GSI1")', () => {
  expect(queries.ordersByStatus('PENDING')?.index === 'GSI1', 'a status lookup across all customers needs a GSI');
});

await check('ordersByStatus: every order with that status, oldest first', () => {
  expectEqual(ids(q(queries.ordersByStatus('PENDING'), 'ordersByStatus'), 'orderId'), ['o3', 'o2', 'o5'], 'PENDING: ');
  expectEqual(ids(q(queries.ordersByStatus('SHIPPED'), 'ordersByStatus'), 'orderId'), ['o1', 'o4'], 'SHIPPED: ');
  expectEqual(ids(q(queries.ordersByStatus('CANCELLED'), 'ordersByStatus'), 'orderId'), ['o6'], 'CANCELLED: ');
});

await check('only orders are in GSI1 (sparse index: customers and line items have no GSI1 keys)', () => {
  const inGsi = [...table.items.values()].filter((it) => it.GSI1PK !== undefined || it.GSI1SK !== undefined);
  expect(inGsi.length === data.orders.length + extra.orders.length,
    `${inGsi.length} items have GSI1 keys; only the ${data.orders.length + extra.orders.length} orders should`);
});
