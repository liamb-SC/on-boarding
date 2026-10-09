// npm run db:migrate: apply every migration in ./drizzle that local.db hasn't
// had yet. Drizzle records the applied ones in a __drizzle_migrations table.
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { openDb } from './db.js';

const db = openDb();
migrate(db, { migrationsFolder: 'drizzle' });
console.log('✓ local.db is up to date');
