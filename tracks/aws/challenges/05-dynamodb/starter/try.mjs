// Run with: node try.mjs   — saves a few orders, then reads them back.
import { putOrder, ordersFor, latestOrders } from './orders.mjs';

await putOrder({ customerId: 'ada', orderId: '2026-01-05#001', total: 21.25, status: 'SHIPPED' });
await putOrder({ customerId: 'ada', orderId: '2026-02-11#002', total: 8.5, status: 'SHIPPED' });
await putOrder({ customerId: 'ada', orderId: '2026-03-20#003', total: 42, status: 'PENDING' });
await putOrder({ customerId: 'grace', orderId: '2026-02-01#004', total: 99.99, status: 'PENDING' });

console.log('ordersFor(ada):', await ordersFor('ada'));
console.log('latestOrders(ada, 2):', await latestOrders('ada', 2));
