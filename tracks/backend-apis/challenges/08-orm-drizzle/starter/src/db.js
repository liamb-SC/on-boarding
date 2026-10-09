import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

// Open a SQLite file (or ':memory:') as a Drizzle database.
export function openDb(file = 'local.db') {
  const sqlite = new Database(file);
  sqlite.pragma('foreign_keys = ON'); // SQLite doesn't enforce FKs unless asked
  return drizzle(sqlite, { schema });
}
