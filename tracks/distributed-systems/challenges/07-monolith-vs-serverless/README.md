# 07 · Monolith vs serverless

**Skills:** weighing a monolith against functions-as-a-service, writing a
short architecture decision record (ADR), extracting one function from a
monolith (Lambda handler shape, SQS batches, partial batch failures).

## Background
|  | Monolith | Serverless (Lambda, Cloud Functions…) |
|--|----------|---------------------------------------|
| Deploy | one artefact, all at once | many small functions, each on its own |
| Scaling | the whole app, by instance | per function, automatic, down to zero |
| Cost | you pay for servers even when idle | per request/ms, with little cost at idle and possibly a lot at steady high load |
| Latency | warm and in-process | network hops, and **cold starts** |
| Dev experience | one repo, easy to run and debug locally | harder to run the whole thing locally; distributed tracing needed |
| Limits | few | timeouts (15 min), payload sizes, concurrency quotas |

Neither wins outright. A well-structured monolith is a fine default. Spiky,
event-driven, self-contained jobs (receipts, thumbnails, webhooks) are good
candidates to split out. An **ADR** captures the decision, and the reasoning
behind it, for whoever wonders later.

## Scenario
`monolith.js` renders and emails a receipt *inside* the checkout request.
Black Friday traffic is 50× normal, and slow mail sending is holding up
checkouts. The team is considering moving receipts to a function triggered by
a queue.

## Goal
1. **Decide** by filling in `decision.md`. Each of Context, Options, Decision
   and Consequences needs 25+ words. The Trade-offs table needs 6+ complete
   rows, covering cold starts, cost, scaling, and debugging or observability.
2. **Split it out:**
   - Move `renderReceipt` into `lib/receipt.js` and import it in `monolith.js`.
   - Implement `functions/send-receipt/handler.js`: for each SQS record,
     render and `sendMail(order.email, ...)`. Return the `messageId` of every
     record that failed (bad JSON, mail error) in `batchItemFailures`.

`npm run invoke` calls the handler with a sample batch.

## Hints
- A Lambda handler is just `export async function handler(event) { ... }`.
  Keep it stateless.
- Process each record in its own `try/catch`. If one record throws and you
  let it fail the whole batch, SQS redelivers the good ones too, and that
  means duplicate receipts.
- In the handler, the import path is `'../../lib/receipt.js'`.

## Check your work
```
./onboard validate distributed-systems/07
```
