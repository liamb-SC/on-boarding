import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Each table is a JS object. drizzle-kit diffs this file against the last
// migration to write the next one, and drizzle-orm uses it for typed queries.
export const authors = sqliteTable('authors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

// TODO 1: a `books` table:
//   id              integer primary key (autoIncrement)
//   title           text, not null
//   author_id       integer, not null, references authors.id
//   published_year  integer (nullable)
// (the first argument of integer()/text() is the SQL column name. Use the
//  snake_case names above, and whatever JS property names you like)
