# 03 · Writing a client: metadata, deadlines and errors

**Skills:** calling unary and streaming rpcs from Node, sending metadata
(auth headers), setting deadlines, handling status codes.

## Background
- **Metadata** is gRPC's version of HTTP headers: key/value pairs sent with a
  call, typically for auth (`authorization: Bearer ...`), tracing IDs and
  similar.
  ```js
  const metadata = new grpc.Metadata();
  metadata.set('authorization', `Bearer ${TOKEN}`);
  client.GetBook({ id: '3' }, metadata, (err, book) => { ... });
  ```
- **Deadlines**: by default a gRPC call waits **forever**. A slow dependency
  can then hold up every request behind it, and the slowdown spreads through
  your system. Always set one, and the server gets told about it too, so it
  can stop work nobody's waiting for.
  ```js
  client.GenerateReport({}, metadata, { deadline: Date.now() + 1000 }, (err, res) => { ... });
  ```
- **Errors** arrive as `err.code` (compare with `grpc.status.DEADLINE_EXCEEDED`,
  `grpc.status.UNAUTHENTICATED`, …) and `err.details`.
- **Server streams** are Node event emitters: listen for `data`, `end` and
  `error`.

## Scenario
The Library server is already written (`library-service.js`, run it with
`npm start`). It rejects any call without the auth metadata, and
`GenerateReport` takes about 3 seconds. You're writing `client.js`.

## Goal
Make `client.js`, run with `npm run client`, do three calls **in order** and
print exactly these three lines:
```
Book: Guards! Guards!
Books by Ursula K. Le Guin: 2
Report: timed out
```
1. `GetBook` for id `"3"`.
2. `ListBooks` for author `"Ursula K. Le Guin"`, counting the streamed books.
3. `GenerateReport` with a **1-second deadline**, handling the
   `DEADLINE_EXCEEDED` failure.

Send the auth metadata on **every** call, and make sure the process exits
when it's done.

## Try it
```bash
npm start           # terminal 1: logs each call and its authorization header
npm run client      # terminal 2
```

## Hints
- Wrapping a callback in a Promise lets you write the steps in order with
  `await`:
  ```js
  const getBook = (req) => new Promise((resolve, reject) =>
    client.GetBook(req, metadata, (err, res) => (err ? reject(err) : resolve(res))));
  ```
- For the stream: `const call = client.ListBooks({ author }, metadata);` then
  `call.on('data', ...)` and `call.on('end', ...)`.
- `try { ... } catch (err) { if (err.code === grpc.status.DEADLINE_EXCEEDED) ... }`
- Run it without the metadata once to see `UNAUTHENTICATED`.

## Check your work
```
./onboard validate grpc/03
```
