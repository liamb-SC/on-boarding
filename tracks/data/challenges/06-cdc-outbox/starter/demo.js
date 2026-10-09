// npm run demo
import { openDb } from './sqlite.js';
import { SCHEMA } from './schema.js';
import { placeOrder, cancelOrder } from './orders.js';
import { runProjector } from './projector.js';

const db = await openDb();
db.exec(SCHEMA);

placeOrder(db, { id: 'o1', customer: 'alice', total: 30 });
placeOrder(db, { id: 'o2', customer: 'alice', total: 20 });
placeOrder(db, { id: 'o3', customer: 'bob', total: 99 });
cancelOrder(db, 'o2');

console.table(db.all('SELECT * FROM outbox'));
console.log('applied', runProjector(db), 'events');
console.log('applied', runProjector(db), 'events on the second run');
console.table(db.all('SELECT * FROM customer_stats ORDER BY customer'));
console.table(db.all('SELECT * FROM projector_checkpoint'));
