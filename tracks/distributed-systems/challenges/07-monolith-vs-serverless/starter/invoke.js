// npm run invoke: call the function locally with a sample SQS batch, like `sam local invoke`.
import { handler } from './functions/send-receipt/handler.js';
import { outbox } from './lib/mailer.js';

const order = { id: 'o1', email: 'ada@example.com', items: [{ name: 'Mug', qty: 2, price: 6.5 }] };
const result = await handler({
  Records: [
    { messageId: 'm1', body: JSON.stringify(order) },
    { messageId: 'm2', body: 'not json' },
  ],
});
console.log('result:', JSON.stringify(result));
console.log('sent:', outbox);
