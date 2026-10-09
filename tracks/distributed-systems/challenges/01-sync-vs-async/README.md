# 01 · Synchronous vs asynchronous communication

**Skills:** request/response vs messaging, temporal coupling, queues,
at-least-once delivery and retries, deciding what has to be synchronous.

## Background
- **Synchronous** (HTTP, gRPC): the caller waits for the answer. It's simple and
  you get the result right away, but the caller is only as fast and as available
  as *everything* it calls. If the email provider is down, checkout is down.
- **Asynchronous** (a queue or event broker): the caller records "this
  happened", puts a message on a queue, and moves on. A worker handles it
  later and retries on failure. The caller stays fast and available, at the
  cost of **eventual** completion and more moving parts. Queues usually deliver
  **at least once**, so handlers must cope with seeing a message twice.

Rule of thumb: go synchronous only when the caller **needs the result to
continue**. Everything else can be a message.

## Scenario
`orders.js` sends the confirmation email inline. The email provider
(`email-service.js`) is slow and flaky, so checkout is slow and flaky too.
`queue.js` is an in-process queue that stands in for SQS or RabbitMQ.

## Goal
1. Run `npm run demo` and see a slow, failed checkout.
2. In `orders.js`:
   - `placeOrder` saves the order, publishes
     `{ type: 'OrderPlaced', orderId, email }` with `queue.send(...)`, and returns
     `{ id, status: 'placed' }` straight away.
   - `startWorkers` consumes the queue and sends the email (mention the order id
     in the body). Let errors throw, so the queue redelivers the message.
3. Run `npm run demo` again: checkout is instant, and the email arrives after a retry.
4. In `answers.json`, mark each step of checkout `sync` or `async`.

## Hints
- `queue.consume(async (msg) => { ... })` registers the worker.
- Swallowing the error in the worker (`try { ... } catch {}`) loses the email
  for good. Rethrow it, or don't catch it at all.

## Check your work
```
./onboard validate distributed-systems/01
```
