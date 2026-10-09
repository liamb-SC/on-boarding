# 01 · Protobuf contracts and a unary RPC

**Skills:** `.proto` syntax, messages and field numbers, services and rpcs,
implementing a unary handler in Node (`@grpc/grpc-js`), gRPC status codes.

## Background
**gRPC** is an RPC framework. The client calls `GetBook({ id: "1" })` as if
it were a local function, and the call goes over HTTP/2 as compact binary
**Protocol Buffers**. Everything starts with a **`.proto` file**, the contract
that both sides load:

```proto
message GetBookRequest { string id = 1; }       // a typed message
service Library {                               // a set of callable methods
  rpc GetBook (GetBookRequest) returns (Book);  // unary: one request, one response
}
```

- **Field numbers are the contract.** On the wire, a field is identified by its
  number, not its name. If you rename a field, old clients still work. If you
  change its number, every existing client breaks, silently.
- **Errors are status codes**, not HTTP codes: `NOT_FOUND`,
  `INVALID_ARGUMENT`, `UNAUTHENTICATED`, `DEADLINE_EXCEEDED`, … Use the most
  specific one so clients can react correctly.

Compared with REST+JSON you get a strict schema, generated clients, smaller
payloads and streaming, at the cost of not being able to `curl` it easily.
That's why it's popular *between* services rather than for browsers.

## Scenario
`proto/library.proto` defines `Book` but no service yet, and `server.js` has a
stub handler.

## Goal
1. In `proto/library.proto`, add `GetBookRequest` (`string id = 1`) and a
   `Library` service with a unary `GetBook(GetBookRequest) returns (Book)`.
2. In `server.js`, implement `GetBook`:
   - return the matching book from `data.js`
   - an empty id fails with `INVALID_ARGUMENT`
   - an unknown id fails with `NOT_FOUND`

The validator calls your server with a client built from **the agreed
contract** (`contract.proto` in the challenge folder), just like an existing
consumer would. Get a field number wrong and it'll notice.

## Try it
```bash
npm start                                  # terminal 1
npm run call -- GetBook '{"id":"1"}'       # terminal 2
npm run call -- GetBook '{"id":"999"}'
```

## Check your work
```
./onboard validate grpc/01
```
