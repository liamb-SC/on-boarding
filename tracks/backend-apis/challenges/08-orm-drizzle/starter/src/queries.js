import { asc, count, eq } from 'drizzle-orm';
import { authors } from './schema.js';
// import { books } from './schema.js';   // once you've added it

// Example: every author, A-Z. db is what openDb() returns.
export function listAuthors(db) {
  return db.select().from(authors).orderBy(asc(authors.name)).all();
}

// TODO 3: insert a book and return the inserted row, as the table's JS object
//   (use .returning().get()).
//   addBook(db, { title, authorId, publishedYear })
export function addBook(db, book) {
  throw new Error('addBook is not implemented yet');
}

// TODO 4: the books by the author with this name, oldest first, as
//   [{ title, publishedYear }]. Use a join (innerJoin) on the author.
export function booksByAuthor(db, authorName) {
  throw new Error('booksByAuthor is not implemented yet');
}

// TODO 5: every author A-Z with how many books they have (0 included), as
//   [{ name, books }]. Use leftJoin + count() + groupBy.
export function authorsWithBookCount(db) {
  throw new Error('authorsWithBookCount is not implemented yet');
}
