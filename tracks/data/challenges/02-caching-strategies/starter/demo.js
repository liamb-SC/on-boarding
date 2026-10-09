// Try your cache: npm run demo
import { createDb } from './db.js';
import { TtlCache, createUserService } from './cache.js';

const db = createDb();
const users = createUserService({ db, cache: new TtlCache({ ttlMs: 1000 }) });

await users.getUser('1');
await users.getUser('1');
console.log('two reads of user 1   -> db reads:', db.stats.reads, '(want 1)');

await Promise.all(Array.from({ length: 10 }, () => users.getUser('2')));
console.log('10 concurrent reads   -> db reads:', db.stats.reads, '(want 2)');

await users.updateUser('1', { plan: 'enterprise' });
console.log('after update, user 1 ->', await users.getUser('1'));
