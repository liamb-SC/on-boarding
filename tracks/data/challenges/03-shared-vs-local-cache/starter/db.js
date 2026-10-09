// The "database": a JSON file that every app process reads and writes, the way
// several app servers all talk to one Postgres. Don't edit this file.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILE = process.env.DB_FILE ?? fileURLToPath(new URL('./prices.db.json', import.meta.url));
const SEED = { 'sku-1': 10, 'sku-2': 25 };

const load = () => (existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : { ...SEED });

export const db = {
  async getPrice(sku) { return load()[sku] ?? null; },
  async setPrice(sku, price) { writeFileSync(FILE, JSON.stringify({ ...load(), [sku]: price })); },
  reset() { writeFileSync(FILE, JSON.stringify(SEED)); },
};
