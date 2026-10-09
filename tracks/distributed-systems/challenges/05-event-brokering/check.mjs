import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, stage, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const ref = stage(path.join(path.dirname(fileURLToPath(import.meta.url)), 'starter'), 'brokering');
const aws = await fromSandbox(`${ref}/aws-lite.js`);
const { buildTopology } = await fromSandbox('./topology.js');

const fresh = () => buildTopology(aws);
const drain = (q) => q?.receive(100) ?? [];
const publish = (t, eventType, orderId = 'o1') => t.publish({ message: { orderId }, attributes: { eventType } });
const ev = (detailType, detail, source = 'shop.orders') => ({ source, 'detail-type': detailType, detail });

await check('buildTopology returns the topic, the bus and the four queues', () => {
  const t = fresh();
  expect(t?.orderEvents && t.bus, 'return { orderEvents, bus, queues }');
  for (const k of ['billing', 'shipping', 'fraudCheck', 'euAnalytics']) expect(t.queues?.[k], `queues.${k} is missing`);
});

await check('SNS fan-out: an OrderPlaced message reaches billing AND shipping', () => {
  const t = fresh();
  publish(t.orderEvents, 'OrderPlaced');
  expect(drain(t.queues.billing).length === 1, 'billing did not get a copy');
  expect(drain(t.queues.shipping).length === 1, 'shipping did not get a copy');
});

await check('SNS filter policy: shipping ignores OrderRefunded, billing still gets it', () => {
  const t = fresh();
  publish(t.orderEvents, 'OrderRefunded');
  publish(t.orderEvents, 'OrderCancelled');
  expect(drain(t.queues.billing).length === 2, 'billing should get every event type');
  expect(drain(t.queues.shipping).length === 0, 'shipping received a non-OrderPlaced message');
});

await check('SNS: each subscriber gets its own copy (one consumer can\'t steal another\'s)', () => {
  const t = fresh();
  publish(t.orderEvents, 'OrderPlaced', 'o42');
  drain(t.queues.billing);
  const s = drain(t.queues.shipping);
  expect(s[0]?.message?.orderId === 'o42', 'shipping lost its copy');
});

await check('EventBridge big-orders: total >= 1000 OrderPlaced from shop.orders goes to fraud-check', () => {
  const t = fresh();
  t.bus.putEvents([ev('OrderPlaced', { orderId: 'a', total: 1000, country: 'US' }), ev('OrderPlaced', { orderId: 'b', total: 5000, country: 'DE' })]);
  expectEqual(drain(t.queues.fraudCheck).map((e) => e.detail?.orderId), ['a', 'b']);
});

await check('EventBridge big-orders: small orders, other detail-types and other sources are not matched', () => {
  const t = fresh();
  t.bus.putEvents([
    ev('OrderPlaced', { orderId: 'small', total: 999.99, country: 'US' }),
    ev('OrderRefunded', { orderId: 'refund', total: 2000, country: 'US' }),
    ev('OrderPlaced', { orderId: 'other', total: 2000, country: 'US' }, 'shop.test'),
  ]);
  expectEqual(drain(t.queues.fraudCheck).map((e) => e.detail?.orderId), []);
});

await check('EventBridge eu-orders: DE, FR, IE and NL orders of any detail-type go to eu-analytics', () => {
  const t = fresh();
  t.bus.putEvents(['DE', 'FR', 'IE', 'NL', 'US', 'GB'].map((c, i) =>
    ev(i % 2 ? 'OrderRefunded' : 'OrderPlaced', { orderId: c, total: 10, country: c })));
  t.bus.putEvents([ev('OrderPlaced', { orderId: 'X', total: 10, country: 'DE' }, 'crm.customers')]);
  expectEqual(drain(t.queues.euAnalytics).map((e) => e.detail?.orderId), ['DE', 'FR', 'IE', 'NL']);
});

await check('EventBridge: one event can match several rules', () => {
  const t = fresh();
  t.bus.putEvents([ev('OrderPlaced', { orderId: 'big-eu', total: 4000, country: 'FR' })]);
  expect(drain(t.queues.fraudCheck).length === 1 && drain(t.queues.euAnalytics).length === 1, 'should land in both queues');
});

const EXPECTED = {
  'consumers-that-process-one-queue-message': '1',
  'queues-that-get-one-topic-message': '3',
  'resize-each-upload-once-across-workers': 'queue',
  'billing-shipping-analytics-all-react': 'pubsub',
  'absorb-a-burst-for-a-slow-consumer': 'queue',
};
let answers = {};
try { answers = JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8')); } catch {}
for (const [key, want] of Object.entries(EXPECTED)) {
  await check(`answers.json: ${key}`, () => {
    const got = String(answers[key] ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    expect(got === want, 'not right yet');
  });
}
