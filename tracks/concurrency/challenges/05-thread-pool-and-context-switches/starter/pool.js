// A fixed-size pool of worker threads that run tasks from a queue.
//
//   const pool = new WorkerPool(4, new URL('./task-worker.js', import.meta.url));
//   const result = await pool.run({ n: 100000 });
//   await pool.close();
//
// Workers speak a tiny protocol (see task-worker.js): the pool posts `data`,
// the worker replies { result } or { error: message }.
import { Worker } from 'node:worker_threads';

export class WorkerPool {
  constructor(size, workerFile) {
    // TODO: start `size` workers, and keep track of which are idle.
  }

  // Resolves with the worker's `result`, or rejects with Error(error) if it
  // replied { error }. If every worker is busy, the task waits in a queue.
  run(data) {
    // TODO
    return Promise.reject(new Error('TODO: WorkerPool.run'));
  }

  // Terminates every worker. Resolves once they're gone.
  async close() {
    // TODO
  }
}
