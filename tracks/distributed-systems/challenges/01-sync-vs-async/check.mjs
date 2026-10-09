import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog(30000);
const { createEmailService } = await fromSandbox('./email-service.js');
const { createQueue } = await fromSandbox('./queue.js');
const { createOrderService } = await fromSandbox('./orders.js');

const shop = (emailOpts) => {
  const emailService = createEmailService(emailOpts);
  const queue = createQueue({ retryDelayMs: 10 });
  const service = createOrderService({ emailService, queue });
  return { emailService, queue, service };
};
const timed = async (fn) => { const t = performance.now(); const v = await fn(); return [v, performance.now() - t]; };

await check('placeOrder answers quickly even when email takes 500ms', async () => {
  const { service, queue } = shop({ latencyMs: 500 });
  const [res, ms] = await timed(() => service.placeOrder({ id: 'o1', email: 'a@x.io' }));
  expect(ms < 100, `checkout took ${Math.round(ms)}ms`);
  expectEqual(res, { id: 'o1', status: 'placed' });
  service.startWorkers();
  await queue.drain();
});

await check('placeOrder succeeds while the email provider is down', async () => {
  const { service, queue } = shop({ down: true, latencyMs: 5 });
  const res = await service.placeOrder({ id: 'o2', email: 'b@x.io' });
  expect(res?.status === 'placed', `got ${JSON.stringify(res)}`);
  expect(service.orders.length === 1, 'the order was not saved');
});

await check('placeOrder publishes an OrderPlaced message on the queue', async () => {
  const { service, queue } = shop({ latencyMs: 5 });
  const seen = [];
  queue.consume(async (msg) => { seen.push(msg); });
  await service.placeOrder({ id: 'o3', email: 'c@x.io' });
  await queue.drain();
  expect(seen.length === 1, `${seen.length} messages were published`);
  expect(JSON.stringify(seen[0]).includes('OrderPlaced'), `message: ${JSON.stringify(seen[0])} (give it type: 'OrderPlaced')`);
});

await check('the worker sends exactly one confirmation email per order, to the right address', async () => {
  const { service, queue, emailService } = shop({ latencyMs: 5 });
  service.startWorkers();
  await service.placeOrder({ id: 'o4', email: 'd@x.io' });
  await service.placeOrder({ id: 'o5', email: 'e@x.io' });
  await queue.drain();
  expectEqual(emailService.sent.map((m) => m.to).sort(), ['d@x.io', 'e@x.io']);
  expect(emailService.sent.every((m) => /o4|o5/.test(m.body)), 'mention the order id in the email body');
});

await check('a temporary email failure is retried by the queue, not lost', async () => {
  const { service, queue, emailService } = shop({ latencyMs: 5, failTimes: 2 });
  service.startWorkers();
  await service.placeOrder({ id: 'o6', email: 'f@x.io' });
  await queue.drain();
  expect(emailService.sent.length === 1, `sent ${emailService.sent.length} emails after ${emailService.attempts} attempts (don't swallow the error; throw so the queue redelivers)`);
  expect(queue.deadLetters.length === 0, 'the message ended up in the dead-letter list');
});

const EXPECTED = {
  'check-stock-before-confirming': 'sync',
  'send-confirmation-email': 'async',
  'authorise-card-payment': 'sync',
  'update-recommendations': 'async',
  'generate-invoice-pdf': 'async',
};
let answers = {};
try { answers = JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8')); } catch {}
for (const [key, want] of Object.entries(EXPECTED)) {
  await check(`answers.json: ${key}`, () => {
    const got = String(answers[key] ?? '').trim().toLowerCase();
    expect(got === 'sync' || got === 'async', 'answer "sync" or "async"');
    expect(got === want, 'not quite. Does the customer need the result before checkout can finish?');
  });
}
