# 04 · Pagination: offset vs cursor

**Skills:** `LIMIT`/`OFFSET` pagination, cursor (keyset) pagination, opaque
cursors, and what each does when the data changes under you.

## Background
**Offset pagination** says "skip N rows, take 10": `?limit=10&offset=20`.
It's simple and lets you jump to page 7, but it counts positions, and
positions move:
- A new row at the top pushes everything down by one, so the next page
  **repeats** a row you've already seen.
- A deleted row pulls everything up by one, so the next page **skips** a row
  you never saw.
- It also gets slower on deep pages, because the database still walks past
  every skipped row.

**Cursor (keyset) pagination** says "give me 10 rows after *this one*":
`WHERE id < :lastSeenId ORDER BY id DESC LIMIT 10`. It's stable while data
changes and fast at any depth (it's an index seek), but you can only go
next/previous, not jump to page 7. Clients get the cursor as an **opaque**
string (often base64 JSON), so you can change what's inside it later.

## Scenario
`app.js` already exposes `GET /posts` (offset) and `GET /posts/feed` (cursor),
but both helpers in `pagination.js` are empty. `posts.js` holds a 25-post feed,
newest first.

## Goal
1. Implement `offsetPage` and `cursorPage` in `pagination.js` (read the
   comments for the exact return shapes).
   - `cursorPage` must compare ids (`id < lastId`), not look up the last row's
     index. If that row has been deleted, it must still work.
   - A cursor that can't be decoded throws an error with `status = 400`.
2. Run `npm run demo` and fill in `answers.json`: which post id did offset
   pagination show twice after a publish, and which one did it skip after a
   delete? Notice what the cursor lines do instead.

## Try it
```bash
npm run demo
npm start
curl 'localhost:3000/posts?limit=5&offset=5'
curl 'localhost:3000/posts/feed?limit=5'     # then pass back ?cursor=<nextCursor>
```

## Hints
- `Buffer.from(JSON.stringify({ id })).toString('base64url')` encodes a
  cursor, and `JSON.parse(Buffer.from(c, 'base64url').toString())` decodes it.
  Wrap the decode in `try` and check you got a number.
- `nextCursor` is built from the **last item of the page**, and is `null`
  when there's nothing after it.

## Check your work
```
./onboard validate backend-apis/04
```
