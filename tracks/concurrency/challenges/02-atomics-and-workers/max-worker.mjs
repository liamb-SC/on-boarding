// Validator-owned worker: hammers the learner's atomicMax from one thread.
import { workerData } from 'node:worker_threads';
import { rng } from '../../sched.mjs';

const { atomicMax } = await import(workerData.module);
const view = new Int32Array(workerData.shared);
const next = rng(workerData.seed);
// Rising values make threads keep overtaking each other near the top.
for (let i = 0; i < workerData.count; i++) atomicMax(view, 0, i * 64 + Math.floor(next() * 64));
