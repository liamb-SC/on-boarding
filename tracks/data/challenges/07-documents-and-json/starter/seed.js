// The shop's relational database, plus one flexible-schema column. Don't edit this file.
import { openDb } from './sqlite.js';

export async function seededDb() {
  const db = await openDb();
  db.exec(`
    CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT, email TEXT, city TEXT);
    -- Every product has a few fixed columns, plus "attrs": a JSON document whose
    -- shape depends on the category (shirts have sizes, books have an ISBN...).
    CREATE TABLE products (sku TEXT PRIMARY KEY, name TEXT, category TEXT, price INTEGER, attrs TEXT);
    CREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), status TEXT, placed_at TEXT);
    CREATE TABLE order_items (order_id INTEGER REFERENCES orders(id), sku TEXT REFERENCES products(sku), qty INTEGER, unit_price INTEGER);

    INSERT INTO customers VALUES
      (1, 'Ada Lovelace', 'ada@example.com', 'London'),
      (2, 'Grace Hopper', 'grace@example.com', 'New York');

    INSERT INTO products VALUES
      ('TS-RED-M',  'Logo tee',        'shirt', 20, '{"color":"red","sizes":["S","M","L"],"tags":["cotton","bestseller"]}'),
      ('TS-BLU-L',  'Logo tee',        'shirt', 20, '{"color":"blue","sizes":["L"],"tags":["cotton"]}'),
      ('HD-RED',    'Zip hoodie',      'shirt', 45, '{"color":"red","sizes":["M","L","XL"],"tags":["fleece","bestseller"]}'),
      ('BK-DDIA',   'Designing Data-Intensive Applications', 'book', 40, '{"isbn":"978-1449373320","pages":616,"tags":["bestseller","databases"]}'),
      ('BK-SRE',    'Site Reliability Engineering',          'book', 35, '{"isbn":"978-1491929124","pages":552,"tags":["databases","ops"]}'),
      ('MUG-RED',   'Red mug',         'mug',   12, '{"color":"red","capacity_ml":350,"tags":["ceramic"]}');

    INSERT INTO orders VALUES
      (1001, 1, 'shipped', '2024-05-01T10:00:00Z'),
      (1002, 2, 'placed',  '2024-05-03T12:30:00Z');

    INSERT INTO order_items VALUES
      (1001, 'BK-DDIA',  1, 38),
      (1001, 'TS-RED-M', 2, 20),
      (1001, 'MUG-RED',  1, 12),
      (1002, 'BK-SRE',   1, 35);
  `);
  return db;
}
