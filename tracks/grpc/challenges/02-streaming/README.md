# 02 · Streaming RPCs

**Skills:** `stream` in `.proto`, server-streaming and client-streaming
handlers, `repeated` fields, evolving a contract without breaking it.

## Background
gRPC runs on HTTP/2, so a call can carry **a stream of messages** in either
direction:

| Kind | Proto | Use it for |
|------|-------|-----------|
| unary | `rpc A (Req) returns (Res)` | normal request/response |
| server streaming | `rpc A (Req) returns (stream Res)` | large or incremental results, live feeds |
| client streaming | `rpc A (stream Req) returns (Res)` | uploads, batching many items into one call |
| bidirectional | `rpc A (stream Req) returns (stream Res)` | chat, real-time sync |

Streaming lets the client start working on the first result before the last
one exists, and nobody has to hold a huge response in memory.

Adding new messages and rpcs (and new fields with **new numbers**) is
backwards compatible. Old clients just don't use them. This challenge is that
kind of change.

## Scenario
Challenge 01's `GetBook` is done. Now consumers want to list books without
calling `GetBook` in a loop, and an importer wants to upload books in bulk.

## Goal
1. In the proto, add:
   - `ListBooksRequest { string author = 1; }`
   - `AddBooksSummary { int32 added = 1; repeated string ids = 2; }`
   - `rpc ListBooks (ListBooksRequest) returns (stream Book);`
   - `rpc AddBooks (stream Book) returns (AddBooksSummary);`
2. In `server.js`, implement:
   - `ListBooks`: stream every book (or only the given `author`'s), then end.
     If nothing matches, end with no messages. That isn't an error.
   - `AddBooks`: save each incoming book with the next id (`"6"`, `"7"`, …)
     and reply once the client finishes, e.g. `{ added: 2, ids: ["6","7"] }`.

## Try it
```bash
npm start                                                    # terminal 1
npm run call -- ListBooks '{}'                               # terminal 2
npm run call -- ListBooks '{"author":"Terry Pratchett"}'
npm run call -- AddBooks '[{"title":"The Fifth Season","author":"N. K. Jemisin","year":2015}]'
```

## Hints
- Server stream: `for (const b of matches) call.write(b); call.end();`
- Client stream: `call.on('data', (book) => ...)` then
  `call.on('end', () => callback(null, summary))`.
- In proto3 an unset string arrives as `''`, not `undefined`.

## Check your work
```
./onboard validate grpc/02
```
