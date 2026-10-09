// 20,000 orders from 2,000 customers, with no indexes beyond the primary key. Don't edit this file.
import { openDb } from './sqlite.js';

export async function seededDb() {
  const db = await openDb();
  db.exec(`CREATE TABLE orders (
    id          INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    status      TEXT NOT NULL,
    total       INTEGER NOT NULL,
    created_at  TEXT NOT NULL
  )`);
  const statuses = ['placed', 'paid', 'shipped', 'delivered', 'cancelled'];
  db.tx(() => {
    for (let i = 1; i <= 20000; i += 1) {
      // created_at is unique per order: (i * 7919) % 20000 visits every slot once.
      const createdAt = new Date(Date.UTC(2024, 0, 1) + ((i * 7919) % 20000) * 25 * 60_000).toISOString();
      db.run('INSERT INTO orders VALUES (?, ?, ?, ?, ?)',
        [i, 1 + (i * 7919) % 2000, statuses[i % 5], 5 + (i * 31) % 200, createdAt]);
    }
  });
  return db;
}

// The two queries the app runs all day.
export const QUERIES = {
  // "My orders" page: a customer's 10 most recent orders.
  recentForCustomer: {
    sql: 'SELECT id, total, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10',
    params: [42],
  },
  // Warehouse dashboard: how many orders are waiting to ship.
  countByStatus: {
    sql: 'SELECT count(*) AS n FROM orders WHERE status = ?',
    params: ['paid'],
  },
};
