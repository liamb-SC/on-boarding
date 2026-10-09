// Runs on its own thread, in parallel with the others.
import { workerData } from 'node:worker_threads';

const counter = new Int32Array(workerData.shared);
for (let i = 0; i < workerData.iterations; i++) {
  counter[0]++;   // read, add one, write back: three steps another thread can land between
}
