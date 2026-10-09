// Registers in-memory exporters (instead of instrumentation.js's console ones),
// runs three orders through the learner's processOrder, then inspects the
// finished spans and the collected metrics.
import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const { metrics, SpanStatusCode } = await fromSandbox('@opentelemetry/api');
const { NodeTracerProvider } = await fromSandbox('@opentelemetry/sdk-trace-node');
const { InMemorySpanExporter, SimpleSpanProcessor } = await fromSandbox('@opentelemetry/sdk-trace-base');
const { AggregationTemporality, InMemoryMetricExporter, MeterProvider, PeriodicExportingMetricReader } =
  await fromSandbox('@opentelemetry/sdk-metrics');

const spanExporter = new InMemorySpanExporter();
new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(spanExporter)] }).register();
const metricExporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
const meterProvider = new MeterProvider({
  readers: [new PeriodicExportingMetricReader({ exporter: metricExporter, exportIntervalMillis: 3_600_000 })],
});
metrics.setGlobalMeterProvider(meterProvider);

// Only now load the learner's code, so its tracer/meter come from these providers.
const { processOrder } = await fromSandbox('./orders.js');

const results = [];
for (const order of [
  { id: 'o-1', items: ['mug', 'tee'], total: 25 },
  { id: 'o-2', items: ['poster'], total: 12 },
  { id: 'o-3', items: ['sofa'], total: 2400 },
]) {
  try { results.push({ ok: await processOrder(order) }); } catch (err) { results.push({ err }); }
}

const spans = spanExporter.getFinishedSpans();
const parentId = (s) => s.parentSpanContext?.spanId ?? s.parentSpanId;
const root = (id) => spans.find((s) => s.name === 'processOrder' && s.attributes['order.id'] === id);

await check('processOrder still works: two orders succeed, the declined one still throws', () => {
  expectEqual(results[0].ok?.receipt, { receiptId: 'rcpt_o-1' }, 'o-1: ');
  expect(results[1].ok, `o-2 failed: ${results[1].err?.message}`);
  expect(results[2].err?.message === 'payment declined for o-3', 'o-3 should reject with the payment error (rethrow it)');
});
await check('a finished `processOrder` span for every order, even the failed one', () =>
  expect(['o-1', 'o-2', 'o-3'].every(root), `finished spans: ${spans.map((s) => `${s.name}(${s.attributes['order.id'] ?? ''})`).join(', ') || 'none'}. Spans only export once ended`));
await check('processOrder spans have attributes order.id and order.item_count', () => {
  const s = root('o-1');
  expect(s, 'no processOrder span for o-1');
  expectEqual(s.attributes['order.item_count'], 2, 'order.item_count: ');
});
await check('reserveInventory and chargePayment are child spans of processOrder (same trace)', () => {
  const r = root('o-1');
  for (const name of ['reserveInventory', 'chargePayment']) {
    const child = spans.find((s) => s.name === name && parentId(s) === r?.spanContext().spanId);
    expect(child, `no ${name} span whose parent is o-1's processOrder span (use startActiveSpan so the context carries over)`);
    expect(child.spanContext().traceId === r.spanContext().traceId, `${name} is in a different trace`);
  }
});
await check('each order is its own trace', () =>
  expect(new Set(['o-1', 'o-2', 'o-3'].map((id) => root(id)?.spanContext().traceId)).size === 3, 'orders share a traceId'));
await check('the failed order: status ERROR and an exception event on processOrder', () => {
  const s = root('o-3');
  expect(s?.status.code === SpanStatusCode.ERROR, `status is ${JSON.stringify(s?.status)}. Use span.setStatus({ code: SpanStatusCode.ERROR })`);
  expect(s.events.some((e) => e.name === 'exception'), 'no exception event. Use span.recordException(err)');
});
await check('the failed chargePayment span is marked ERROR too', () => {
  const pay = spans.find((s) => s.name === 'chargePayment' && parentId(s) === root('o-3')?.spanContext().spanId);
  expect(pay?.status.code === SpanStatusCode.ERROR, `chargePayment status is ${JSON.stringify(pay?.status)}`);
});
await check('successful spans are not marked ERROR', () =>
  expect(root('o-1')?.status.code !== SpanStatusCode.ERROR, 'o-1 is marked as an error'));

await meterProvider.forceFlush();
const collected = metricExporter.getMetrics().at(-1)?.scopeMetrics.flatMap((sm) => sm.metrics) ?? [];
const metric = (name) => collected.find((m) => m.descriptor.name === name);
await check('counter orders_processed_total: 2 with status "ok", 1 with status "error"', () => {
  const m = metric('orders_processed_total');
  expect(m, `no such metric. Metrics seen: ${collected.map((x) => x.descriptor.name).join(', ') || 'none'}`);
  const by = Object.fromEntries(m.dataPoints.map((d) => [d.attributes.status, d.value]));
  expectEqual(by, { ok: 2, error: 1 }, 'counts by status: ');
});
await check('histogram order_duration_ms (unit ms): one plausible duration per order', () => {
  const m = metric('order_duration_ms');
  expect(m, 'no such metric');
  expect(m.descriptor.unit === 'ms', `unit is "${m.descriptor.unit}"`);
  const count = m.dataPoints.reduce((n, d) => n + d.value.count, 0);
  const sum = m.dataPoints.reduce((n, d) => n + d.value.sum, 0);
  expectEqual(count, 3, 'recorded values: ');
  expect(sum > 60 && sum < 5000, `durations add up to ${sum}ms. Record milliseconds, e.g. performance.now() differences`);
});
