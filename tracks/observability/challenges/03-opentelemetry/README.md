# 03 · Traces and metrics with OpenTelemetry

**Skills:** the OpenTelemetry API vs SDK, tracers and spans, span attributes,
parent/child spans and context, recording errors on spans, counters,
histograms, metric attributes, exporters.

## Background
- **Logs** say what happened. **Metrics** say how much and how often, cheaply
  and over time. **Traces** show where one request's time went, as a tree of
  **spans**:
  ```
  processOrder            ████████████████████  48ms
    reserveInventory      ███████               20ms
    chargePayment                ████████████   26ms  ✗ payment declined
  ```
- **OpenTelemetry (OTel)** is the vendor-neutral standard. Your code uses only
  `@opentelemetry/api`. The **SDK**, set up once at startup
  (`instrumentation.js` here), decides where the data goes: console, an
  in-memory test exporter, or OTLP to a collector, Jaeger, Datadog...
- `tracer.startActiveSpan(name, fn)` makes the span **active** while `fn`
  runs, so spans started inside it become its children. A span must be
  `end()`ed, or it's never exported. Use `try/finally`.
- On failure: `span.recordException(err)` and
  `span.setStatus({ code: SpanStatusCode.ERROR })`, then rethrow. Telemetry
  shouldn't change behaviour.
- A **counter** only goes up (requests, errors). A **histogram** records a
  distribution (durations), which is where p95/p99 come from.
  **Attributes** like `{ status: 'error' }` let you slice them, but keep
  their values to a small, fixed set. An order ID as a metric attribute
  creates millions of series.

## Scenario
`orders.js` processes an order: reserve stock, then take payment. Payments
over 1000 are declined. It has no telemetry.

## Goal
In `orders.js`, using only `@opentelemetry/api`:
1. Get a tracer and a meter named `orders`. Create a counter
   `orders_processed_total` and a histogram `order_duration_ms` with unit `ms`.
2. Wrap `processOrder` in a span `processOrder` with attributes `order.id`
   and `order.item_count`. Give `reserveInventory` and `chargePayment` their
   own **child** spans with those names.
3. When something throws: record the exception and set status `ERROR` on
   the failing span (and on `processOrder`), end the spans, and rethrow.
4. For every order, add 1 to the counter with attribute `status: 'ok'` or
   `'error'`, and record its duration in milliseconds in the histogram.

Run `npm start` to see your spans and metrics printed by the console exporters.

## Hints
- `tracer.startActiveSpan('name', { attributes: {...} }, async (span) => { ... })`
  returns whatever your callback returns, so you can `return await` through it.
- A small helper `inSpan(name, attrs, fn)` that does the try/catch/finally
  once saves writing it three times.
- `performance.now()` before and after gives milliseconds.

## Going further
- `prom-client` exposes metrics in Prometheus format on a `/metrics` endpoint
  for a Prometheus server to scrape: the "pull" alternative to pushing OTLP.
- Auto-instrumentation (`@opentelemetry/auto-instrumentations-node`) creates
  spans for HTTP, Express, database clients and so on with no code changes. Manual
  spans like yours add the business steps.
- Traces can start in the browser and continue into the backend through the
  `traceparent` header. The web-basics track covers frontend tracing.

## Check your work
The validator swaps in in-memory exporters, runs three orders through your
code, and inspects the spans and metrics.
```
./onboard validate observability/03
```
