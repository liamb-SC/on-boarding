# Track: gRPC

Service-to-service APIs with gRPC in Node (`@grpc/grpc-js`): Protobuf
contracts, servers, streaming, and well-behaved clients.

## Requirements
Node.js 20+ and network access to the npm registry. Each challenge's setup
installs `@grpc/grpc-js` and `@grpc/proto-loader`. There's no code generation
step: the `.proto` is loaded at runtime.

## Learning objectives
By the end you can:
- Write `.proto` messages and services, and explain why field numbers are the contract.
- Implement unary rpcs and return the right status codes.
- Implement server-streaming and client-streaming rpcs.
- Evolve a contract without breaking existing clients.
- Write a client that sends metadata (auth), sets deadlines and handles status codes.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | proto-and-unary | messages, field numbers, services, unary handlers, `NOT_FOUND`/`INVALID_ARGUMENT` |
| 02 | streaming | `stream` rpcs, `call.write`/`end`, `data`/`end` events, `repeated` |
| 03 | client-metadata-deadlines | `grpc.Metadata`, deadlines, `DEADLINE_EXCEEDED`, consuming streams |

Every sandbox includes `npm start` (the server on `:50051`) and
`npm run call -- <Method> '<json>'`, a small grpcurl-style client.

Start with: `./onboard start grpc/01`
