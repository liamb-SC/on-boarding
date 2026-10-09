// npm run demo
import { createCluster } from './cluster.js';
import { createRouter } from './router.js';

const cluster = createCluster({ replicas: 2 });
const db = createRouter(cluster);

await db.write('alice', 'profile:alice', 'new bio');
console.log('alice reads her own write:', await db.read('alice', 'profile:alice'));
console.log('bob reads it (may be stale):', await db.read('bob', 'profile:alice'));
cluster.replicate();
for (let i = 0; i < 4; i += 1) await db.read('bob', 'profile:alice');

for (const node of [cluster.primary, ...cluster.replicas]) console.log(node.name, node.stats);
