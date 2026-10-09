# Track: Distributed systems

The patterns that keep a system of many services fast, available and
understandable: how services talk, how they find each other, how they fail
gracefully, and how to measure all of it. Everything runs in plain Node.

## Requirements
Node.js 20+. There are no npm dependencies and no Docker. Brokers, registries
and backends are simulated in-process, so you can watch every message.
(05 has an optional LocalStack bonus.)

## Learning objectives
By the end you can:
- Choose synchronous or asynchronous communication, and move work onto a queue.
- Implement a circuit breaker (closed / open / half-open) and explain why it stops cascading failures.
- Build a service registry with heartbeats and TTLs, and balance across live instances.
- Separate command and query models (CQRS), and build a projection from events.
- Use queues vs pub/sub, SNS → SQS fan-out with filter policies, and EventBridge rules.
- Put an API gateway in front of services: routing, auth, rate limiting, request IDs.
- Weigh monolith vs serverless in an ADR, and split a function out of a monolith.
- Do availability maths, retry with backoff and jitter, and make writes idempotent.
- Reason in percentiles, enforce timeouts with cancellation, and hedge tail latency.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | sync-vs-async | request/response vs messaging, queues, retries, temporal coupling |
| 02 | circuit-breaker | CLOSED / OPEN / HALF_OPEN, fail fast, trial requests |
| 03 | service-discovery | register, heartbeat, TTL expiry, round-robin client |
| 04 | cqrs | commands vs events, write-model rules, projections, eventual consistency |
| 05 | event-brokering | queue vs pub/sub, SNS → SQS fan-out, filter policies, EventBridge patterns |
| 06 | api-gateway | path routing, API-key auth, rate limiting (`429`), `x-request-id` |
| 07 | monolith-vs-serverless | ADR trade-offs, Lambda handler, SQS partial batch failures |
| 08 | availability | the nines, backoff + jitter, idempotency keys |
| 09 | latency | p50/p99, timeouts + `AbortSignal`, deadline budgets, hedged requests |

Start with: `./onboard start distributed-systems/01`
