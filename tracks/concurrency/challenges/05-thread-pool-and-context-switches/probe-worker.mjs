// Validator-owned worker. It speaks the same protocol as task-worker.js and
// records, in shared memory, how many tasks are running at once across threads.
import { parentPort, threadId } from 'node:worker_threads';

const sleep = new Int32Array(new SharedArrayBuffer(4));
parentPort.on('message', ({ shared, ms, value, fail }) => {
  const stats = new Int32Array(shared); // [running now, most ever running]
  const now = Atomics.add(stats, 0, 1) + 1;
  for (let seen = Atomics.load(stats, 1); now > seen;) {
    const prev = Atomics.compareExchange(stats, 1, seen, now);
    if (prev === seen) break;
    seen = prev;
  }
  Atomics.wait(sleep, 0, 0, ms); // "work" for ms milliseconds
  Atomics.sub(stats, 0, 1);
  parentPort.postMessage(fail ? { error: `task ${value} failed` } : { result: { value: value * 2, threadId } });
});
