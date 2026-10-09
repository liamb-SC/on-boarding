// npm run demo
import { retry } from './retry.js';
import { createPaymentHandler } from './payments.js';

let calls = 0;
const flaky = async () => { calls += 1; if (calls < 3) throw new Error('503'); return 'ok'; };
const waits = [];
console.log('retry result:', await retry(flaky, { sleep: async (ms) => { waits.push(Math.round(ms)); } }), 'after', calls, 'calls, waits', waits);

let charges = 0;
const processor = { async charge(amount) { charges += 1; return { chargeId: `ch_${charges}`, amount }; } };
const payments = createPaymentHandler(processor);
await payments.charge({ idempotencyKey: 'order-42', amount: 500 });
await payments.charge({ idempotencyKey: 'order-42', amount: 500 }); // the client timed out and retried
console.log('card charged', charges, 'time(s) (want 1)');
