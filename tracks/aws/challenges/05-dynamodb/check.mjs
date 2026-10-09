import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { config, done, nonce, notFound, sdk } from '../../fixtures/validator.mjs';

watchdog(60000);
const { DynamoDBClient, DescribeTableCommand, GetItemCommand } = await sdk('dynamodb');
const ddb = new DynamoDBClient(config);
const TableName = 'orders';

let table;
await check('table orders exists', async () => {
  try {
    table = (await ddb.send(new DescribeTableCommand({ TableName }))).Table;
  } catch (e) {
    throw new Error(notFound(e) ? 'not found — run node table.mjs' : e.message);
  }
});

await check('partition key customerId (S), sort key orderId (S)', () => {
  expect(table, 'no table');
  const keys = Object.fromEntries(table.KeySchema.map((k) => [k.KeyType, k.AttributeName]));
  expectEqual(keys, { HASH: 'customerId', RANGE: 'orderId' }, 'KeySchema: ');
  const types = Object.fromEntries(table.AttributeDefinitions.map((a) => [a.AttributeName, a.AttributeType]));
  expect(types.customerId === 'S' && types.orderId === 'S', `attribute types: ${JSON.stringify(types)}`);
});

await check('billing mode is on-demand (PAY_PER_REQUEST)', () => {
  expect(table, 'no table');
  const mode = table.BillingModeSummary?.BillingMode;
  // Some emulators omit BillingModeSummary; on-demand tables report 0/0 capacity.
  const zeroCapacity = !table.ProvisionedThroughput?.ReadCapacityUnits && !table.ProvisionedThroughput?.WriteCapacityUnits;
  expect(mode === 'PAY_PER_REQUEST' || (!mode && zeroCapacity), `billing mode: ${mode ?? 'PROVISIONED'}`);
});

let mod;
await check('orders.mjs loads and exports putOrder, ordersFor and latestOrders', async () => {
  mod = await fromSandbox('./orders.mjs');
  for (const f of ['putOrder', 'ordersFor', 'latestOrders']) expect(typeof mod[f] === 'function', `${f} is not exported`);
});

// Fresh customers each run, so leftovers from earlier runs can't interfere.
const alice = nonce('cust');
const bob = nonce('cust');
const mine = [
  { customerId: alice, orderId: '2026-03-02#b7', total: 15.5, status: 'PENDING' },
  { customerId: alice, orderId: '2026-01-15#a1', total: 99.99, status: 'SHIPPED' },
  { customerId: alice, orderId: '2026-02-20#c3', total: 7, status: 'SHIPPED' },
];
const sorted = [...mine].sort((a, b) => a.orderId.localeCompare(b.orderId));
const pick = (o) => ({ customerId: o.customerId, orderId: o.orderId, total: o.total, status: o.status });

await check('putOrder stores the order with total as a number', async () => {
  expect(mod, 'orders.mjs did not load');
  for (const o of mine) await mod.putOrder({ ...o });
  await mod.putOrder({ customerId: bob, orderId: '2026-02-01#zz', total: 1, status: 'PENDING' });
  const { Item } = await ddb.send(new GetItemCommand({ TableName, Key: { customerId: { S: alice }, orderId: { S: '2026-01-15#a1' } } }));
  expect(Item, 'the item is not in the table');
  expect(Item.total?.N === '99.99', `total is stored as ${JSON.stringify(Item.total)}`);
  expect(Item.status?.S === 'SHIPPED', `status is stored as ${JSON.stringify(Item.status)}`);
});

let readsWork = false;
await check("ordersFor returns exactly that customer's orders, oldest first, as plain objects", async () => {
  expect(mod, 'orders.mjs did not load');
  const got = await mod.ordersFor(alice);
  expect(Array.isArray(got), `expected an array, got ${JSON.stringify(got)}`);
  expectEqual(got.map(pick), sorted.map(pick));
  readsWork = true;
});

await check('latestOrders(customer, 2) returns the two newest, newest first', async () => {
  expect(mod, 'orders.mjs did not load');
  const got = await mod.latestOrders(alice, 2);
  expect(Array.isArray(got), `expected an array, got ${JSON.stringify(got)}`);
  expectEqual(got.map((o) => o.orderId), [sorted[2].orderId, sorted[1].orderId]);
});

await check('orders.mjs reads with Query, not Scan', () => {
  expect(readsWork, 'get ordersFor working first');
  const src = readFileSync(path.join(SANDBOX, 'orders.mjs'), 'utf8').replace(/\/\/.*$/gm, '');
  expect(/QueryCommand/.test(src), 'no QueryCommand used');
  expect(!/Scan(Command)?\b/.test(src), 'found a Scan: read one partition with Query instead');
});

done();
