// npm run shards
import { createShard } from './shards.js';
import { createShardedStore, shardFor } from './router.js';

const shards = ['s0', 's1', 's2', 's3'].map(createShard);
const store = createShardedStore(shards);
for (let i = 1; i <= 1000; i += 1) await store.insert({ id: i, customer_id: 1 + (i % 100), total: i });

const perShard = [0, 0, 0, 0];
for (let c = 1; c <= 10000; c += 1) perShard[shardFor(c, 4)] += 1;
console.log('customers per shard (of 10,000):', perShard);

shards.forEach((s) => { s.stats.queries = 0; });
console.log('orders for customer 7:', (await store.ordersForCustomer(7)).length);
console.log('total orders:', await store.countAll());
console.log('queries per shard:', shards.map((s) => s.stats.queries));
