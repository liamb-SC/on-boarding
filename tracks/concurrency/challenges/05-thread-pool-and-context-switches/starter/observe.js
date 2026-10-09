// Observe context switches: the same total CPU work, split across
// "one thread per core" and then "4 threads per core".
// Writes what it saw to observations.json.
import { writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';

const cores = availableParallelism();
const TOTAL_LOOPS = 40_000_000 * cores; // ~0.5-1s of work per core

// Each worker waits for a shared "go" flag, then burns CPU. Starting them all
// first means we measure only the work, not thread start-up.
const burn = `
  const { parentPort, workerData } = require('node:worker_threads');
  const go = new Int32Array(workerData.go);
  parentPort.postMessage('ready');
  Atomics.wait(go, 0, 0);
  let x = 0;
  for (let i = 0; i < workerData.loops; i++) x = (x + Math.sqrt(i)) % 1e9;
  parentPort.postMessage(x);
`;

async function run(threads) {
  const go = new Int32Array(new SharedArrayBuffer(4));
  const workers = Array.from({ length: threads }, () =>
    new Worker(burn, { eval: true, workerData: { go: go.buffer, loops: Math.floor(TOTAL_LOOPS / threads) } }));
  const next = () => Promise.all(workers.map((w) => new Promise((resolve) => w.once('message', resolve))));
  await next(); // all ready
  const finished = next();
  const before = process.resourceUsage();
  const t0 = performance.now();
  Atomics.store(go, 0, 1);
  Atomics.notify(go, 0);
  await finished;
  const ms = Math.round(performance.now() - t0);
  const after = process.resourceUsage();
  await Promise.all(workers.map((w) => w.terminate()));
  return {
    threads,
    ms,
    involuntary: after.involuntaryContextSwitches - before.involuntaryContextSwitches,
    voluntary: after.voluntaryContextSwitches - before.voluntaryContextSwitches,
  };
}

const rows = [await run(cores), await run(Math.min(cores * 4, 128))];
console.log(`${cores} cores available`);
console.table(rows);
writeFileSync('observations.json', `${JSON.stringify({ cores, rows }, null, 2)}\n`);
console.log('saved to observations.json');
