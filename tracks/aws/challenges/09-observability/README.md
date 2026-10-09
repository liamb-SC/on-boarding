# 09 · CloudWatch and X-Ray

**Skills:** log groups, streams and retention, structured logs, custom
metrics with dimensions, alarms, and reading an X-Ray trace (segments,
subsegments, faults, annotations).

## Background
Observability on AWS has three parts:

- **CloudWatch Logs**: a **log group** per app or function (Lambda writes to
  `/aws/lambda/<name>`), containing **log streams** of timestamped events. Set
  **retention**, because the default is "keep forever, pay forever". Log JSON
  so you can query fields (`level`, `orderId`) instead of grepping text.
- **CloudWatch Metrics**: numbers over time, in a **namespace**, with
  **dimensions** (key/value pairs) that slice them. An **alarm** watches one
  statistic (e.g. `Sum` of `Errors` per 60 s) and goes into `ALARM` when it
  crosses a threshold for N periods. It can then notify an SNS topic.
- **X-Ray**: distributed **traces**. A request gets a trace id. Each service it
  passes through records a **segment** (API Gateway, the Lambda service, your
  function), and the calls made inside it are **subsegments** (DynamoDB, an
  HTTP API...). Each has start/end times (epoch seconds) and flags: `error`
  (4xx), `throttle` (429) and `fault` (5xx). **Annotations** are indexed, so
  you can search traces by them. **Metadata** isn't.

Instrumenting a Node Lambda: turn on **active tracing** on the function
(`TracingConfig: { Mode: 'Active' }`), then wrap your SDK clients with the X-Ray
SDK, `AWSXRay.captureAWSv3Client(new DynamoDBClient({}))`, so each AWS call
becomes a subsegment. Newer setups use OpenTelemetry (the ADOT Lambda layer)
for the same result.

LocalStack's free edition has no X-Ray, so the second half of this challenge
is about reading a real-shaped trace.

## Goal
1. Finish `observe.mjs` and run it (the comments give the details):
   - log group **`/onboard/checkout`** with **7-day** retention and at least
     3 JSON log events, one of them `"level":"ERROR"`;
   - metrics **`CheckoutLatency`** (≥ 5 data points, Milliseconds) and
     **`Errors`** in namespace **`Onboard/Checkout`**, dimension
     `Service=checkout`;
   - alarm **`checkout-errors`**: `Sum` of `Errors` ≥ 1 over 60 s, for 1
     period, missing data treated as `notBreaching`.
2. Read `trace.json` (a failed checkout request, as returned by
   `BatchGetTraces`, with each segment's `Document` already parsed) and fill in
   `trace-answers.json`. Use numbers for the `-ms` answers and `a`/`b`/`c` for
   the rest.

| Key | Question | a | b | c |
|-----|----------|---|---|---|
| `total-ms` | How long did the whole request take, as API Gateway saw it, in ms? | | | |
| `init-ms` | This was a cold start. How long did the function's initialization take, in ms? | | | |
| `slowest-call` | Which downstream call took the longest? | `payments.example.com` | DynamoDB `GetItem` | DynamoDB `UpdateItem` |
| `root-cause` | Why did the client get a 502? | DynamoDB was slow | The cold start timed out | `payments.example.com` returned 502, and the function threw a `PaymentError` |
| `fault-means` | `"fault": true` on a segment means... | a 4xx client error | a 5xx server error | it was throttled (429) |
| `searchable` | You want to find all traces for gold-tier customers. That works because `customerTier` is... | an annotation | metadata | the segment's name |
| `instrument` | What gave this trace its `DynamoDB` subsegments? | `console.log` in the handler | CloudWatch detailed monitoring | Active tracing plus an X-Ray-wrapped SDK client |
| `which-is-a-segment` | Which of these is a **segment**, not a subsegment? | DynamoDB `GetItem` | `Initialization` | The `AWS::Lambda::Function` one named `checkout-fn` |

## Hints
- Logs: `CreateLogGroupCommand({ logGroupName })`,
  `PutRetentionPolicyCommand({ logGroupName, retentionInDays: 7 })`,
  `PutLogEventsCommand({ logGroupName, logStreamName, logEvents })`.
- Metrics: `PutMetricDataCommand({ Namespace, MetricData: [{ MetricName, Unit, Value, Dimensions: [{ Name: 'Service', Value: 'checkout' }] }] })`.
  `MetricData` takes many data points at once.
- Alarm: `PutMetricAlarmCommand` with `AlarmName`, `Namespace`, `MetricName`,
  `Dimensions`, `Statistic`, `Period`, `EvaluationPeriods`, `Threshold`,
  `ComparisonOperator: 'GreaterThanOrEqualToThreshold'` and `TreatMissingData`.
- Metric data can't be deleted, so the validator ignores anything sent before
  the first whole minute after setup. That's how a reset starts clean.
- Durations: `(end_time - start_time) * 1000`. Subsegments nest inside their
  segment's `subsegments` array. A segment's `parent_id` points at the
  subsegment that called it.

## Check your work
```
./onboard validate aws/09
```
