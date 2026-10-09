import { availableParallelism } from 'node:os';
import { WorkerPool } from './pool.js';

const size = availableParallelism();
const pool = new WorkerPool(size, new URL('./task-worker.js', import.meta.url));

const t0 = performance.now();
const tasks = Array.from({ length: size * 4 }, (_, i) => pool.run({ n: 300_000 + i }));
const results = await Promise.all(tasks);
const threads = new Set(results.map((r) => r.threadId));
console.log(`${results.length} tasks on ${threads.size} threads (pool size ${size}) in ${Math.round(performance.now() - t0)}ms`);
console.log('first result:', results[0]);

await pool.run({ n: -1 }).catch((err) => console.log('bad task rejected:', err.message));
await pool.close();
