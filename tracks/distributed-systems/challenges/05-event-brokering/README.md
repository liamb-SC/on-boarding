# 05 · Event brokering: queues, pub/sub, fan-out and routing rules

**Skills:** point-to-point queues vs publish/subscribe, competing consumers,
SNS → SQS fan-out, SNS filter policies, EventBridge rules and event patterns.

## Background
| | **Queue** (SQS, RabbitMQ queue) | **Pub/sub topic** (SNS, Kafka topic, EventBridge) |
|-|------|------|
| Each message goes to | **one** consumer (they compete) | **every** subscriber gets a copy |
| Use it for | spreading work across workers, buffering bursts | announcing a fact that many services react to |

On AWS the two are combined: an **SNS topic fans out to several SQS queues**,
one per consuming service. Each service gets its own durable copy and
processes it at its own pace. A **filter policy** on a subscription means a
queue only receives the messages it cares about.

**EventBridge** is an event bus with **rules**. Each rule has an **event
pattern** (match on `source`, `detail-type`, and anything inside `detail`:
prefixes, numeric ranges, lists) and sends matching events to targets. The
producer doesn't know who is listening.

```json
{ "source": ["shop.orders"], "detail": { "total": [{ "numeric": [">=", 100] }] } }
```

## Scenario
`aws-lite.js` has in-process stand-ins for SQS, SNS and EventBridge, with the
same pattern syntax as AWS. `topology.js` creates the queues, a topic and a bus,
but connects nothing.

## Goal
1. Complete the four TODOs in `topology.js`: the fan-out, the shipping filter
   policy, and the `big-orders` and `eu-orders` rules.
2. Answer the five questions in `answers.json`.

`npm run demo` publishes a few messages and shows where each one landed.

## Hints
- `orderEvents.subscribe(queues.billing)` subscribes a queue to the topic.
  The second argument takes `{ filterPolicy: { eventType: [...] } }`.
- `bus.putRule({ name, eventPattern: { source: [...], 'detail-type': [...], detail: {...} }, targets: [queue] })`
- Every value in a pattern is an **array** of allowed values or matchers, even
  when there's only one.
- Bonus, with Docker: LocalStack (`docker run -p 4566:4566 localstack/localstack`)
  and `awslocal sns subscribe --protocol sqs ...` / `awslocal events put-rule
  --event-pattern ...` build the same thing against real AWS APIs.

## Check your work
```
./onboard validate distributed-systems/05
```
