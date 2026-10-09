# 08 · An ORM: Drizzle + SQLite

**Skills:** defining tables in code, generating and applying migrations,
foreign keys, typed queries (`select`, `insert … returning`, `innerJoin`,
`leftJoin` + `count` + `groupBy`).

## Background
An **ORM** (or a lighter "query builder" such as Drizzle) lets you describe
tables in code and query them with functions instead of SQL strings. The
popular Node options are Prisma, Drizzle, TypeORM and Sequelize. Drizzle
stays close to SQL and runs on a plain SQLite file, so there's nothing to host.

The workflow is the same in almost every ORM:

```
edit src/schema.js  ──▶  npm run db:generate  ──▶  drizzle/0001_xxx.sql  ──▶  npm run db:migrate
 (the desired shape)       (diff → new SQL file)     (commit this!)              (apply to a database)
```

- **Migrations** are versioned, append-only SQL files. Each environment (your
  laptop, CI, prod) applies the ones it hasn't seen yet. Drizzle tracks them in
  a `__drizzle_migrations` table. **Never edit a migration that has already
  been applied.** Add a new one instead.
- The ORM builds parameterised SQL for you:
  `db.select().from(books).where(eq(books.authorId, 3))` becomes
  `select ... from books where author_id = ?`, so there's no SQL injection.

## Scenario
A bookshop database. `src/schema.js` defines `authors`, and its migration
(`drizzle/0000_init.sql`) has been applied to `local.db`. There's no `books`
table yet, and the query functions in `src/queries.js` are stubs.

## Goal
1. Add a `books` table to `src/schema.js` (see the `TODO` for the columns),
   with `author_id` referencing `authors.id`.
2. Generate the migration and apply it to `local.db`.
3. Implement `addBook`, `booksByAuthor` and `authorsWithBookCount` in
   `src/queries.js`.

The validator applies your migrations to a fresh database, checks that the
schema and migrations agree, and runs your queries against its own data.

## Try it
```bash
npm run db:generate      # look at the SQL it wrote in drizzle/
npm run db:migrate
sqlite3 local.db '.schema books'    # if you have the sqlite3 CLI
npm run db:studio        # optional: browse the DB in your browser
```

## Hints
- `.references(() => authors.id)` declares the foreign key.
- `db.insert(books).values({...}).returning().get()`.
- `db.select({ title: books.title, ... }).from(books).innerJoin(authors, eq(books.authorId, authors.id)).where(...).orderBy(asc(...)).all()`.
- `count(books.id)` counts only matching rows, so authors with no books get 0
  after a `leftJoin`.

## Check your work
```
./onboard validate backend-apis/08
```
