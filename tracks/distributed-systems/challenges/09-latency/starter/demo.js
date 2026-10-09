// npm run demo: 200 requests to a backend where 1 in 20 calls is very slow.
import { createBackend } from './backend.js';
import { percentile, hedged } from './latency.js';

const pattern = Array.from({ length: 20 }, (_, i) => (i === 7 ? 400 : 10 + (i % 5)));

async function run(label, call) {
  const times = [];
  for (let i = 0; i < 200; i += 1) {
    const t = performance.now();
    await call();
    times.push(performance.now() - t);
  }
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const f = (n) => `${Math.round(n)}ms`.padStart(6);
  console.log(`${label.padEnd(10)} mean ${f(mean)}  p50 ${f(percentile(times, 50))}  p95 ${f(percentile(times, 95))}  p99 ${f(percentile(times, 99))}`);
}

const plain = createBackend(pattern);
await run('plain', () => plain.call());
const hedgedBackend = createBackend(pattern);
await run('hedged', () => hedged((signal) => hedgedBackend.call(signal), { hedgeAfterMs: 30 }));
console.log(`hedging cost ${hedgedBackend.calls - 200} extra calls (${((hedgedBackend.calls - 200) / 2).toFixed(1)}%)`);
