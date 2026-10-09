import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog(60000);
const { default: Database } = await fromSandbox('better-sqlite3');
const { drizzle } = await fromSandbox('drizzle-orm/better-sqlite3');
const { migrate } = await fromSandbox('drizzle-orm/better-sqlite3/migrator');
const DRIZZLE = path.join(SANDBOX, 'drizzle');

const sqlFiles = existsSync(DRIZZLE) ? readdirSync(DRIZZLE).filter((f) => f.endsWith('.sql')).sort() : [];
let journal = [];
try { journal = JSON.parse(readFileSync(path.join(DRIZZLE, 'meta/_journal.json'), 'utf8')).entries; } catch { /* checked below */ }

await check('a second migration was generated (drizzle/0001_*.sql) and is in the journal', () => {
  expect(sqlFiles.length >= 2, `found ${sqlFiles.length} migration(s): run npm run db:generate`);
  expectEqual(journal.length, sqlFiles.length, 'meta/_journal.json entries vs .sql files: ');
});
await check('the new migration creates the books table', () => {
  expect(sqlFiles.length >= 2, 'no new migration yet');
  const sql = sqlFiles.slice(1).map((f) => readFileSync(path.join(DRIZZLE, f), 'utf8')).join('\n');
  expect(/CREATE TABLE [`"]?books[`"]?/i.test(sql), 'no CREATE TABLE books in the new migration(s)');
});
await check('the init migration was not edited (never change an applied migration)', () => {
  const sql = readFileSync(path.join(DRIZZLE, sqlFiles[0] ?? 'missing'), 'utf8');
  expect(!/books/i.test(sql), `${sqlFiles[0]} mentions books: add a NEW migration instead`);
});

// Apply all migrations to a fresh in-memory database, like a new environment would.
let sqlite;
const migrated = await check('all migrations apply cleanly to a fresh database', () => {
  sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  migrate(drizzle(sqlite), { migrationsFolder: DRIZZLE });
});
if (!migrated) process.exit(1);

await check('books has id (PK), title (NOT NULL), author_id (NOT NULL), published_year', () => {
  const cols = Object.fromEntries(sqlite.pragma('table_info(books)').map((c) => [c.name, c]));
  expect(Object.keys(cols).length, 'there is no books table');
  for (const name of ['id', 'title', 'author_id', 'published_year']) expect(cols[name], `no ${name} column`);
  expect(cols.id.pk === 1, 'id is not the primary key');
  expect(cols.title.notnull === 1, 'title should be NOT NULL');
  expect(cols.author_id.notnull === 1, 'author_id should be NOT NULL');
  expect(cols.published_year.notnull === 0, 'published_year should be nullable');
});
await check('books.author_id is a foreign key to authors.id', () => {
  const fk = sqlite.pragma('foreign_key_list(books)').find((f) => f.from === 'author_id');
  expect(fk && fk.table === 'authors' && fk.to === 'id', 'no FOREIGN KEY (author_id) REFERENCES authors(id)');
});

await check('schema.js and the migrations are in sync (db:generate has nothing new to write)', () => {
  const scratch = 'node_modules/.onboard-validator/drift';
  rmSync(path.join(SANDBOX, scratch), { recursive: true, force: true });
  cpSync(DRIZZLE, path.join(SANDBOX, scratch), { recursive: true });
  const out = execFileSync('npx', ['drizzle-kit', 'generate', '--dialect', 'sqlite', '--schema', './src/schema.js', '--out', scratch],
    { cwd: SANDBOX, encoding: 'utf8', stdio: 'pipe' });
  expect(/No schema changes/i.test(out), 'schema.js has changes that aren\'t in a migration yet: run npm run db:generate');
});
await check('local.db has had every migration applied (npm run db:migrate)', () => {
  const file = path.join(SANDBOX, 'local.db');
  expect(existsSync(file), 'no local.db');
  const local = new Database(file, { readonly: true });
  try {
    const n = local.prepare('SELECT count(*) AS n FROM __drizzle_migrations').get().n;
    expectEqual(n, journal.length, 'applied migrations: ');
  } finally { local.close(); }
});

// Seed with plain SQL, then call the learner's query functions.
const seeded = await check('test data can be inserted into authors and books', () => sqlite.exec(`
  INSERT INTO authors (id, name) VALUES (1, 'Ursula K. Le Guin'), (2, 'Terry Pratchett'), (3, 'Octavia E. Butler');
  INSERT INTO books (title, author_id, published_year) VALUES
    ('The Dispossessed', 1, 1974), ('A Wizard of Earthsea', 1, 1968), ('Guards! Guards!', 2, 1989);
`));
if (!seeded) process.exit(1);
const schema = await fromSandbox('./src/schema.js');
const q = await fromSandbox('./src/queries.js');
const db = drizzle(sqlite, { schema });

await check('booksByAuthor returns that author\'s books, oldest first, as { title, publishedYear }', () => {
  expectEqual(q.booksByAuthor(db, 'Ursula K. Le Guin'), [
    { title: 'A Wizard of Earthsea', publishedYear: 1968 },
    { title: 'The Dispossessed', publishedYear: 1974 },
  ]);
  expectEqual(q.booksByAuthor(db, 'Nobody'), [], 'unknown author: ');
});
await check('authorsWithBookCount counts books per author A-Z, including zero', () => {
  expectEqual(q.authorsWithBookCount(db), [
    { name: 'Octavia E. Butler', books: 0 },
    { name: 'Terry Pratchett', books: 1 },
    { name: 'Ursula K. Le Guin', books: 2 },
  ]);
});
await check('addBook inserts and returns the new row', () => {
  const row = q.addBook(db, { title: 'Kindred', authorId: 3, publishedYear: 1979 });
  expect(row && Number.isInteger(row.id) && row.title === 'Kindred', `returned ${JSON.stringify(row)}`);
  expectEqual(sqlite.prepare('SELECT title, author_id, published_year FROM books WHERE id = ?').get(row.id),
    { title: 'Kindred', author_id: 3, published_year: 1979 }, 'row in the database: ');
});
await check('the foreign key is enforced: a book for a missing author is rejected', () => {
  let err;
  try { q.addBook(db, { title: 'Ghost', authorId: 999, publishedYear: 2000 }); } catch (e) { err = e; }
  expect(err && /FOREIGN KEY/i.test(err.message), 'inserting authorId 999 did not fail with a FOREIGN KEY error');
});
sqlite.close();
