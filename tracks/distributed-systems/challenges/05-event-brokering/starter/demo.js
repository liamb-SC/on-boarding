// npm run demo
import * as aws from './aws-lite.js';
import { buildTopology } from './topology.js';

const { orderEvents, bus, queues } = buildTopology(aws);

orderEvents.publish({ message: { orderId: 'o1' }, attributes: { eventType: 'OrderPlaced' } });
orderEvents.publish({ message: { orderId: 'o1' }, attributes: { eventType: 'OrderRefunded' } });
bus.putEvents([
  { source: 'shop.orders', 'detail-type': 'OrderPlaced', detail: { orderId: 'o2', total: 1500, country: 'DE' } },
  { source: 'shop.orders', 'detail-type': 'OrderPlaced', detail: { orderId: 'o3', total: 20, country: 'US' } },
]);

for (const [name, q] of Object.entries(queues)) console.log(name.padEnd(12), JSON.stringify(q.receive()));
