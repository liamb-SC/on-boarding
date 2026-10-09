// npm run try: load the sample data with your keys and run each access pattern.
import { createTable } from './table.js';
import { customers, orders, lineItems } from './data.js';
import { customerItem, orderItem, lineItemItem, queries } from './keys.js';

const table = createTable();
customers.map(customerItem).forEach((i) => table.put(i));
orders.map(orderItem).forEach((i) => table.put(i));
lineItems.map(lineItemItem).forEach((i) => table.put(i));

const show = (label, q) => {
  console.log(`\n${label}  ${JSON.stringify(q)}`);
  console.table(table.query(q));
};
show('getCustomer(c1)', queries.getCustomer('c1'));
show('ordersForCustomer(c1)', queries.ordersForCustomer('c1'));
show('lineItemsForOrder(o3)', queries.lineItemsForOrder('o3'));
show('ordersByStatus(PENDING)', queries.ordersByStatus('PENDING'));
