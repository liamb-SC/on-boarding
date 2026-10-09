// npm run demo
import { createEmailService } from './email-service.js';
import { createQueue } from './queue.js';
import { createOrderService } from './orders.js';

const emailService = createEmailService({ latencyMs: 800, failTimes: 1 });
const queue = createQueue();
const shop = createOrderService({ emailService, queue });
shop.startWorkers();

const start = performance.now();
try {
  const res = await shop.placeOrder({ id: 'o1', email: 'ada@example.com' });
  console.log(`checkout answered in ${Math.round(performance.now() - start)}ms:`, res);
} catch (err) {
  console.log(`checkout FAILED after ${Math.round(performance.now() - start)}ms:`, err.message);
}
await queue.drain();
console.log('emails sent:', emailService.sent, 'attempts:', emailService.attempts);
