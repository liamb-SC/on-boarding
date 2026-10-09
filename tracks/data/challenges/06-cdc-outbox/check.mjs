import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, stage, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = stage(path.resolve(here, '../../fixtures'), 'data');
const schemaDir = stage(path.join(here, 'starter'), 'outbox-schema');
const { openDb } = await fromSandbox(`${fixtures}/sqlite.js`);
const { SCHEMA } = await fromSandbox(`${schemaDir}/schema.js`);
const { placeOrder, cancelOrder } = await fromSandbox('./orders.js');
const { runProjector } = await fromSandbox('./projector.js');

const fresh = async () => { const db = await openDb(); db.exec(SCHEMA); return db; };
const outbox = (db) => db.all('SELECT * FROM outbox ORDER BY id')
  .map((r) => ({ ...r, payload: (() => { try { return JSON.parse(r.payload); } catch { return r.payload; } })() }));
const stats = (db) => db.all('SELECT customer, orders, total_spent FROM customer_stats WHERE orders != 0 OR total_spent != 0 ORDER BY customer');

await check('placeOrder: inserts the order and an OrderPlaced outbox row', async () => {
  const db = await fresh();
  placeOrder(db, { id: 'o1', customer: 'alice', total: 30 });
  expect(db.get("SELECT 1 AS x FROM orders WHERE id = 'o1'"), 'no order row');
  const rows = outbox(db);
  expect(rows.length === 1, `expected 1 outbox row, got ${rows.length}`);
  expect(rows[0].type === 'OrderPlaced' && rows[0].aggregate_id === 'o1', `got ${JSON.stringify(rows[0])}`);
  expectEqual(rows[0].payload, { id: 'o1', customer: 'alice', total: 30 }, 'payload: ');
});

await check('placeOrder: the order and its event are one transaction (if the outbox write fails, no order is saved)', async () => {
  const db = await fresh();
  db.exec(`CREATE TRIGGER boom BEFORE INSERT ON outbox
           WHEN json_extract(NEW.payload, '$.customer') = 'mallory'
           BEGIN SELECT RAISE(ABORT, 'outbox unavailable'); END`);
  let threw = false;
  try { placeOrder(db, { id: 'o9', customer: 'mallory', total: 5 }); } catch { threw = true; }
  expect(threw, 'placeOrder should let the error propagate');
  expect(!db.get("SELECT 1 AS x FROM orders WHERE id = 'o9'"), 'the order was saved without its event: wrap both inserts in db.tx(...)');
});

await check('placeOrder: an invalid order writes no event', async () => {
  const db = await fresh();
  try { placeOrder(db, { id: 'bad', customer: 'alice', total: 0 }); } catch {}
  expect(outbox(db).length === 0, 'an OrderPlaced event exists for an order that was never saved');
});

await check('cancelOrder: sets status cancelled and writes OrderCancelled', async () => {
  const db = await fresh();
  placeOrder(db, { id: 'o1', customer: 'alice', total: 30 });
  cancelOrder(db, 'o1');
  expect(db.get("SELECT status FROM orders WHERE id = 'o1'")?.status === 'cancelled', 'status is not cancelled');
  const ev = outbox(db)[1];
  expect(ev?.type === 'OrderCancelled' && ev.aggregate_id === 'o1', `got ${JSON.stringify(ev)}`);
  expectEqual(ev.payload, { id: 'o1', customer: 'alice', total: 30 }, 'payload: ');
});

// The projector is checked against hand-written outbox rows, so it doesn't depend on orders.js.
const event = (db, type, id, customer, total) => db.run(
  'INSERT INTO outbox (aggregate_id, type, payload) VALUES (?, ?, ?)', [id, type, JSON.stringify({ id, customer, total })]);

await check('projector: builds customer_stats from the outbox', async () => {
  const db = await fresh();
  event(db, 'OrderPlaced', 'o1', 'alice', 30);
  event(db, 'OrderPlaced', 'o2', 'alice', 20);
  event(db, 'OrderPlaced', 'o3', 'bob', 99);
  const n = runProjector(db);
  expect(n === 3, `runProjector returned ${n}, expected 3`);
  expectEqual(stats(db), [
    { customer: 'alice', orders: 2, total_spent: 50 },
    { customer: 'bob', orders: 1, total_spent: 99 },
  ]);
});

await check('projector: saves a checkpoint, so a second run applies nothing', async () => {
  const db = await fresh();
  event(db, 'OrderPlaced', 'o1', 'alice', 30);
  runProjector(db);
  const n = runProjector(db);
  expect(n === 0, `second run applied ${n} events`);
  expectEqual(stats(db), [{ customer: 'alice', orders: 1, total_spent: 30 }]);
  const cp = db.get("SELECT last_id FROM projector_checkpoint WHERE name = 'customer_stats'");
  expect(cp?.last_id === 1, `checkpoint is ${JSON.stringify(cp)}; expected last_id 1 under name 'customer_stats'`);
});

await check('projector: only new events are applied on the next run (including cancellations)', async () => {
  const db = await fresh();
  event(db, 'OrderPlaced', 'o1', 'alice', 30);
  event(db, 'OrderPlaced', 'o2', 'alice', 20);
  runProjector(db);
  event(db, 'OrderCancelled', 'o2', 'alice', 20);
  event(db, 'OrderPlaced', 'o4', 'carol', 15);
  const n = runProjector(db);
  expect(n === 2, `applied ${n}, expected 2`);
  expectEqual(stats(db), [
    { customer: 'alice', orders: 1, total_spent: 30 },
    { customer: 'carol', orders: 1, total_spent: 15 },
  ]);
});

await check('projector: resumes from the checkpoint stored in the db (not from memory)', async () => {
  const db = await fresh();
  event(db, 'OrderPlaced', 'o1', 'alice', 30);
  event(db, 'OrderPlaced', 'o2', 'bob', 10);
  // Pretend a previous run already applied event 1 and then the process restarted.
  db.run("INSERT INTO customer_stats VALUES ('alice', 1, 30)");
  db.run("INSERT INTO projector_checkpoint VALUES ('customer_stats', 1)");
  expect(runProjector(db) === 1, 'expected to apply only event 2');
  expectEqual(stats(db), [
    { customer: 'alice', orders: 1, total_spent: 30 },
    { customer: 'bob', orders: 1, total_spent: 10 },
  ]);
});

await check('end to end: orders.js + projector agree with the orders table', async () => {
  const db = await fresh();
  placeOrder(db, { id: 'a', customer: 'alice', total: 10 });
  placeOrder(db, { id: 'b', customer: 'bob', total: 7 });
  runProjector(db);
  placeOrder(db, { id: 'c', customer: 'alice', total: 5 });
  cancelOrder(db, 'b');
  runProjector(db);
  const truth = db.all(`SELECT customer, count(*) AS orders, sum(total) AS total_spent FROM orders
                        WHERE status != 'cancelled' GROUP BY customer ORDER BY customer`);
  expectEqual(stats(db), truth);
});
