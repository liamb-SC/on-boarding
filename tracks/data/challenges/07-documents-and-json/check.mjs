import { cpSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, stage, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const here = path.dirname(fileURLToPath(import.meta.url));
// seed.js imports ./sqlite.js: stage a validator-owned copy of both.
const seedDir = stage(path.join(here, 'starter'), 'catalog');
cpSync(path.resolve(here, '../../fixtures/sqlite.js'), path.join(SANDBOX, seedDir, 'sqlite.js'));
const { seededDb } = await fromSandbox(`${seedDir}/seed.js`);

const read = (f) => readFileSync(path.join(SANDBOX, f), 'utf8');
const readJson = (f) => { try { return JSON.parse(read(f)); } catch (e) { throw new Error(`${f} is not valid JSON: ${e.message}`); } };
const strip = (sql) => sql.replace(/--.*$/gm, '').trim();

async function sameRows(file, reference, extra = '') {
  const sql = strip(read(file));
  expect(sql, `${file} has no query yet`);
  const db = await seededDb();
  if (extra) db.exec(extra);
  const got = db.all(sql);
  const want = db.all(reference);
  expectEqual(got, want);
}

const MORE = `INSERT INTO products VALUES
  ('POLO-RED', 'Polo', 'shirt', 30, '{"color":"red","sizes":["M"],"tags":["cotton","new"]}'),
  ('SCARF-RED', 'Scarf', 'accessory', 15, '{"color":"red","tags":["new"]}')`;

await check('01-red-shirts.sql: sku and name of red shirts, by name', () =>
  sameRows('queries/01-red-shirts.sql',
    `SELECT sku, name FROM products WHERE category = 'shirt' AND json_extract(attrs, '$.color') = 'red' ORDER BY name, sku`));

await check('01-red-shirts.sql: reads the colour from the JSON, so it still works when products are added', async () => {
  expect(/json_extract|->>?/i.test(strip(read('queries/01-red-shirts.sql'))), 'use json_extract(attrs, \'$.color\') (or attrs ->> \'$.color\')');
  await sameRows('queries/01-red-shirts.sql',
    `SELECT sku, name FROM products WHERE category = 'shirt' AND json_extract(attrs, '$.color') = 'red' ORDER BY name, sku`, MORE);
});

await check('02-tag-counts.sql: tag and n, most common first, ties A-Z', () =>
  sameRows('queries/02-tag-counts.sql',
    `SELECT t.value AS tag, count(*) AS n FROM products, json_each(products.attrs, '$.tags') AS t
     GROUP BY t.value ORDER BY n DESC, tag`));

await check('02-tag-counts.sql: still right after more products are added', () =>
  sameRows('queries/02-tag-counts.sql',
    `SELECT t.value AS tag, count(*) AS n FROM products, json_each(products.attrs, '$.tags') AS t
     GROUP BY t.value ORDER BY n DESC, tag`, MORE));

const doc = (() => { try { return readJson('order-1001.json'); } catch { return {}; } })();

await check('order-1001.json: _id, status and placedAt', () => {
  expectEqual({ _id: doc._id, status: doc.status, placedAt: doc.placedAt },
    { _id: 1001, status: 'shipped', placedAt: '2024-05-01T10:00:00Z' });
});

await check('order-1001.json: embeds a customer summary { id, name }', () => {
  expect(doc.customer && typeof doc.customer === 'object', 'customer should be an embedded object, not just an id');
  expectEqual({ id: doc.customer.id, name: doc.customer.name }, { id: 1, name: 'Ada Lovelace' });
});

await check('order-1001.json: embeds the 3 line items as { sku, name, qty, unitPrice }', () => {
  expect(Array.isArray(doc.items), 'items should be an array inside the order');
  const items = doc.items.map(({ sku, name, qty, unitPrice }) => ({ sku, name, qty, unitPrice }))
    .sort((a, b) => a.sku.localeCompare(b.sku));
  expectEqual(items, [
    { sku: 'BK-DDIA', name: 'Designing Data-Intensive Applications', qty: 1, unitPrice: 38 },
    { sku: 'MUG-RED', name: 'Red mug', qty: 1, unitPrice: 12 },
    { sku: 'TS-RED-M', name: 'Logo tee', qty: 2, unitPrice: 20 },
  ]);
});

await check('order-1001.json: total is the sum of qty × unitPrice', () => {
  expect(doc.total === 90, `total is ${doc.total}`);
});

const EXPECTED = {
  'order-line-items': 'embed',
  'customer-full-profile': 'reference',
  'product-reviews': 'reference',
  'shipping-address-at-time-of-order': 'embed',
};
const answers = (() => { try { return readJson('answers.json'); } catch { return {}; } })();
for (const [key, want] of Object.entries(EXPECTED)) {
  await check(`answers.json: ${key}`, () => {
    const got = String(answers[key] ?? '').trim().toLowerCase();
    expect(got === 'embed' || got === 'reference', 'answer "embed" or "reference"');
    expect(got === want, 'not quite. Is it read together with the order? Does it grow without bound, or change on its own?');
  });
}
