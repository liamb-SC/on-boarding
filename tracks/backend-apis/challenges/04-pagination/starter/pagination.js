// Both functions take `rows` sorted newest first (id descending), like
// `SELECT ... ORDER BY id DESC`.

// Offset pagination: "skip `offset` rows, take `limit`".
//   SQL: ... ORDER BY id DESC LIMIT :limit OFFSET :offset
// Returns { items, nextOffset }, where nextOffset is null on the last page.
export function offsetPage(rows, { limit, offset = 0 }) {
  // TODO 1
  throw new Error('offsetPage is not implemented yet');
}

// Cursor (keyset) pagination: "take `limit` rows that come AFTER the last row
// I saw". The cursor encodes that last row's position, here its id.
//   SQL: ... WHERE id < :lastId ORDER BY id DESC LIMIT :limit
// Returns { items, nextCursor }, where nextCursor is null on the last page.
//
// Make the cursor OPAQUE, a string clients pass back but don't build or
// parse: base64url-encode some JSON, e.g. {"id":21} -> "eyJpZCI6MjF9".
// A cursor that can't be decoded must throw an error with `status = 400`.
export function cursorPage(rows, { limit, cursor }) {
  // TODO 2
  throw new Error('cursorPage is not implemented yet');
}
