#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
printf 'node_modules/\n' | put .gitignore
put package.json <<'JSON'
{
  "name": "orders-service",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node --import ./instrumentation.js demo.js"
  },
  "dependencies": {
    "@opentelemetry/api": "^1.9.0",
    "@opentelemetry/resources": "^2.0.0",
    "@opentelemetry/sdk-metrics": "^2.0.0",
    "@opentelemetry/sdk-trace-base": "^2.0.0",
    "@opentelemetry/sdk-trace-node": "^2.0.0"
  }
}
JSON

put instrumentation.js <<'JS'
// Loaded before the app with `node --import ./instrumentation.js`, so the SDK is
// registered before any code asks the API for a tracer or meter. Your code
// (orders.js) only ever imports @opentelemetry/api. Swapping these console
// exporters for OTLP (to a collector, Jaeger, Honeycomb, Datadog...) needs no
// change to it.
import { metrics } from '@opentelemetry/api';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ConsoleMetricExporter, MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

// Who is emitting this telemetry. Every span and metric carries it.
const resource = resourceFromAttributes({ 'service.name': 'orders', 'deployment.environment': 'local' });

const tracerProvider = new NodeTracerProvider({
  resource,
  spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
});
tracerProvider.register(); // also installs async context, so child spans find their parent

const meterProvider = new MeterProvider({
  resource,
  readers: [new PeriodicExportingMetricReader({ exporter: new ConsoleMetricExporter(), exportIntervalMillis: 60_000 })],
});
metrics.setGlobalMeterProvider(meterProvider);

// Flush whatever is buffered when the demo finishes.
process.on('beforeExit', async () => {
  await Promise.all([tracerProvider.shutdown(), meterProvider.shutdown()]);
});
JS

put inventory.js <<'JS'
export async function reserveInventory(items) {
  await new Promise((r) => setTimeout(r, 10 + items.length * 5));
  return { reserved: items.length };
}
JS
put payments.js <<'JS'
// Orders over 1000 are declined.
export async function chargePayment(orderId, total) {
  await new Promise((r) => setTimeout(r, 20));
  if (total > 1000) throw new Error(`payment declined for ${orderId}`);
  return { receiptId: `rcpt_${orderId}` };
}
JS

put orders.js <<'JS'
import { metrics, SpanStatusCode, trace } from '@opentelemetry/api';
import { reserveInventory } from './inventory.js';
import { chargePayment } from './payments.js';

// TODO: a tracer and a meter, both named 'orders'
// TODO: a counter 'orders_processed_total' and a histogram 'order_duration_ms' (unit 'ms')

// order = { id, items: [...], total }
export async function processOrder(order) {
  // TODO: trace and measure this function (see the README)
  await reserveInventory(order.items);
  const receipt = await chargePayment(order.id, order.total);
  return { orderId: order.id, receipt };
}
JS

put demo.js <<'JS'
import { processOrder } from './orders.js';

await processOrder({ id: 'o-1', items: ['mug', 'tee'], total: 25 });
await processOrder({ id: 'o-2', items: ['poster'], total: 12 });
await processOrder({ id: 'o-3', items: ['sofa'], total: 2400 }).catch((e) => console.error('failed:', e.message));
JS

npm_install_sandbox
sb_commit_all "orders service, not yet instrumented"
