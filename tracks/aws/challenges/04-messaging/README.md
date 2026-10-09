# 04 · SQS, SNS and EventBridge

**Skills:** queues vs topics vs event buses, SNS → SQS fan-out, raw message
delivery, EventBridge rules with event patterns, targets, and queue policies.

## Background
| Service | Model | Use it when |
|---------|-------|-------------|
| **SQS** | A **queue**. Producers send, one consumer group pulls, and each message is processed once (then deleted). | Buffering work: "resize these images, at whatever pace the workers manage". |
| **SNS** | A **topic**. Publish once and every subscriber gets a copy (push). | **Fan-out**: one "order placed" should reach email, analytics, billing... |
| **EventBridge** | An **event bus** with **rules**. Each rule has a pattern that matches events by their content and sends them to targets. | **Routing**: "only big orders from the shop go to the fraud check". |

The classic pairing is **SNS → SQS**: each subscriber gets its own durable
queue, so a slow or failing consumer doesn't lose messages or hold up the
others. By default SNS wraps each message in a JSON envelope (`Type`,
`MessageId`, `Message`, ...). **Raw message delivery** sends just the body.

An EventBridge event looks like
`{ "source": "onboard.shop", "detail-type": "OrderPlaced", "detail": { ... } }`.
A rule's **event pattern** lists the values to match:

```json
{ "source": ["onboard.shop"], "detail": { "status": ["PAID"], "total": [{ "numeric": [">", 10] }] } }
```

On real AWS, a queue only accepts messages from SNS or EventBridge if the
**queue policy** allows that service, for that specific topic or rule. Without
it, delivery fails silently. LocalStack doesn't enforce this, but the
validator checks that the policies are there anyway.

## Goal
Finish `messaging.mjs` and run it (`node messaging.mjs`). It already creates
the three queues and has a helper for queue policies.

1. **Fan-out**: an SNS topic **`orders`**, with **`orders-email`** and
   **`orders-analytics`** both subscribed. `orders-analytics` uses **raw
   message delivery**, `orders-email` doesn't. Both queues let the topic send to
   them.
2. **Routing**: an EventBridge rule **`big-orders`** on the default bus that
   matches `source` `onboard.shop`, `detail-type` `OrderPlaced` and
   `detail.total` **≥ 100**, with the **`big-orders`** queue as its target.
   That queue lets the rule send to it.

Then run `node try.mjs`: the test order should reach both fan-out queues (one
wrapped in the envelope, one raw), and only the 300 order should reach
`big-orders`.

The validator publishes and puts its own events, and checks where they land.

## Hints
- `new SubscribeCommand({ TopicArn, Protocol: 'sqs', Endpoint: queueArn, Attributes: { RawMessageDelivery: 'true' } })`
  (`Attributes` only on the raw one).
- `new PutRuleCommand({ Name, EventPattern: JSON.stringify(pattern) })` returns
  the `RuleArn`. The default bus is used if you don't name one.
- `new PutTargetsCommand({ Rule, Targets: [{ Id: 'big-orders-queue', Arn: queueArn }] })`
- "≥ 100" is `[{ "numeric": [">=", 100] }]`.
- Messages a consumer has received come back after the visibility timeout
  unless it deletes them. `try.mjs` deletes what it prints.

## Check your work
```
./onboard validate aws/04
```
