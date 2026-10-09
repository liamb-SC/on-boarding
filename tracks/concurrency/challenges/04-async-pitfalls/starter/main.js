import { canDelete, loadAll, loadOr, saveAll, startSync } from './pitfalls.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
process.on('unhandledRejection', (err) => console.log('  !! unhandled rejection:', err.message));

const saved = [];
await saveAll([1, 2, 3], async (n) => { await sleep(10); saved.push(n); });
console.log('1. saved after saveAll:', saved, '(expected [1, 2, 3])');

let t = Date.now();
const loaded = await loadAll([1, 2, 3, 4, 5], async (n) => { await sleep(50); return n * 10; });
console.log('2. loadAll:', loaded, `${Date.now() - t}ms (expected ~50ms, not ~250ms)`);

console.log('3. loadOr:', await loadOr(async () => { throw new Error('cache miss'); }, 'fallback'), '(expected fallback)');

startSync(async () => { await sleep(10); throw new Error('offline'); }, (err) => console.log('4. onError got:', err.message));
await sleep(50);

console.log('5. canDelete(non-admin):', await canDelete({ name: 'guest' }, async () => false), '(expected false)');
