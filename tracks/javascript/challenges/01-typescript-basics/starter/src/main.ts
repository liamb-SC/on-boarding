import { first, groupBy, orderTotal, type Order } from './orders.js';

const orders: Order[] = [
  { id: 'A1', customer: 'ada', status: 'paid', items: [{ sku: 'mug', qty: 2, unitPrice: 8 }] },
  { id: 'A2', customer: 'linus', status: 'pending', items: [{ sku: 'tee', qty: 1, unitPrice: 20 }] },
  { id: 'A3', customer: 'ada', status: 'paid', items: [{ sku: 'cap', qty: 3, unitPrice: 12 }] },
];

console.log('first order:', first(orders)?.id);
console.log('totals:', orders.map(orderTotal));
const byStatus = groupBy(orders, (o) => o.status);
console.log('paid orders:', (byStatus['paid'] ?? []).map((o) => o.id));
