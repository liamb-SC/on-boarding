// Run SQL against a fresh copy of the shop database:
//   npm run sql -- queries/01-red-shirts.sql
//   npm run sql -- "SELECT * FROM products"
import { existsSync, readFileSync } from 'node:fs';
import { seededDb } from './seed.js';

const arg = process.argv[2];
if (!arg) {
  console.error('usage: npm run sql -- <file.sql | "SQL">');
  process.exit(1);
}
const sql = existsSync(arg) ? readFileSync(arg, 'utf8') : arg;
const db = await seededDb();
console.table(db.all(sql));
