// Count to workers × iterations using real threads that share one integer.
import { Worker } from 'node:worker_threads';

export async function countInParallel({ workers = 4, iterations = 1_000_000 } = {}) {
  const shared = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);  // memory all threads see
  const threads = Array.from({ length: workers }, () =>
    new Worker(new URL('./counter-worker.js', import.meta.url), { workerData: { shared, iterations } }));
  await Promise.all(threads.map((t) => new Promise((resolve, reject) => {
    t.once('exit', resolve);
    t.once('error', reject);
  })));
  return new Int32Array(shared)[0];
}
