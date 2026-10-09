// Sample entities to load into the table. Don't edit this file.
export const customers = [
  { customerId: 'c1', name: 'Ada', email: 'ada@example.com' },
  { customerId: 'c2', name: 'Grace', email: 'grace@example.com' },
];
export const orders = [
  { orderId: 'o1', customerId: 'c1', createdAt: '2024-01-05T09:00:00Z', status: 'SHIPPED', total: 40 },
  { orderId: 'o2', customerId: 'c1', createdAt: '2024-03-17T14:20:00Z', status: 'PENDING', total: 15 },
  { orderId: 'o3', customerId: 'c1', createdAt: '2024-02-11T08:45:00Z', status: 'PENDING', total: 99 },
  { orderId: 'o4', customerId: 'c2', createdAt: '2024-02-01T12:00:00Z', status: 'SHIPPED', total: 12 },
];
export const lineItems = [
  { orderId: 'o1', sku: 'BOOK-1', qty: 1, price: 40 },
  { orderId: 'o2', sku: 'MUG-1', qty: 1, price: 15 },
  { orderId: 'o3', sku: 'TEE-RED', qty: 2, price: 20 },
  { orderId: 'o3', sku: 'HOODIE', qty: 1, price: 59 },
  { orderId: 'o4', sku: 'MUG-1', qty: 1, price: 12 },
];
