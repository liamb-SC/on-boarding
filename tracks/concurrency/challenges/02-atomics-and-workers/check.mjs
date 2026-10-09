import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { rng } from '../../sched.mjs';

watchdog(60000);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const strip = (f) => readFileSync(path.join(SANDBOX, f), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

await check('counter-worker.js increments with Atomics.add, not ++', () => {
  const code = strip('counter-worker.js');
  expect(/Atomics\.add\s*\(/.test(code), 'use Atomics.add(counter, 0, 1)');
  expect(!/\]\s*(\+\+|\+=)|\+\+\s*\w+\s*\[/.test(code), 'the plain ++ / += on the shared array is still there');
});

const { countInParallel } = await fromSandbox('./counter.js');
await check('countInParallel is exact: 4 threads × 250,000 = 1,000,000, every run', async () => {
  for (let run = 1; run <= 5; run++) {
    const got = await countInParallel({ workers: 4, iterations: 250_000 });
    expect(got === 1_000_000, `run ${run}: counted ${got}`);
  }
});

const { atomicMax } = await fromSandbox('./atomic-max.js');
await check('atomicMax raises the value only when the new one is bigger', () => {
  const view = new Int32Array(new SharedArrayBuffer(8));
  view[1] = -100;
  for (const v of [5, 3, 9, 9, -2, 7]) atomicMax(view, 0, v);
  for (const v of [-50, -200, -10]) atomicMax(view, 1, v);
  expectEqual([view[0], view[1]], [9, -10]);
});

await check('atomicMax uses Atomics.load + a compare-and-swap loop (Atomics.compareExchange)', () => {
  const code = strip('atomic-max.js');
  expect(/Atomics\.compareExchange\s*\(/.test(code), 'use Atomics.compareExchange(view, index, expected, value)');
  expect(/Atomics\.load\s*\(/.test(code), 'read the current value with Atomics.load');
  expect(/\b(while|for)\b|do\s*\{/.test(code), 'retry in a loop when another thread got there first');
  expect(!/view\s*\[\s*index\s*\]\s*=[^=]/.test(code), 'there is still a plain write view[index] = ...');
});

await check('atomicMax is correct with 6 threads racing on the same slot', async () => {
  const module = pathToFileURL(path.join(SANDBOX, 'atomic-max.js')).href;
  for (let run = 1; run <= 3; run++) {
    const shared = new SharedArrayBuffer(4);
    const count = 100_000;
    const seeds = Array.from({ length: 6 }, (_, w) => run * 100 + w);
    await Promise.all(seeds.map((seed) => new Promise((resolve, reject) => {
      const w = new Worker(path.join(HERE, 'max-worker.mjs'), { workerData: { shared, module, seed, count } });
      w.once('exit', resolve);
      w.once('error', reject);
    })));
    // the biggest value any thread offered: the last one each thread generated
    const want = Math.max(...seeds.map((seed) => {
      const next = rng(seed);
      let last = 0;
      for (let i = 0; i < count; i++) last = i * 64 + Math.floor(next() * 64);
      return last;
    }));
    const got = new Int32Array(shared)[0];
    expect(got === want, `run ${run}: ended at ${got}, but ${want} was offered`);
  }
});
