// npm run demo
import { createFlakyService } from './flaky-service.js';
import { CircuitBreaker } from './breaker.js';

const svc = createFlakyService({ latencyMs: 200 });
const breaker = new CircuitBreaker((x) => svc.call(x), { failureThreshold: 3, resetTimeoutMs: 1000 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function attempt(i) {
  const t = performance.now();
  try {
    await breaker.call(i);
    console.log(`#${i} ok           state=${breaker.state}`);
  } catch (err) {
    console.log(`#${i} ${err.code === 'CIRCUIT_OPEN' ? 'fast-fail' : 'failed   '} ${String(Math.round(performance.now() - t)).padStart(4)}ms state=${breaker.state}`);
  }
}

svc.mode = 'down';
for (let i = 1; i <= 6; i += 1) await attempt(i);
console.log(`service received ${svc.calls} calls; waiting for the reset timeout...`);
await sleep(1100);
svc.mode = 'up';
for (let i = 7; i <= 9; i += 1) await attempt(i);
