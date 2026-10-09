// Deterministic fake access log for the percentiles challenge. Setup writes it
// into the sandbox; the validator regenerates it, so editing the sandbox copy
// can't change the expected answers.
//   node latency.mjs > latency.log
import { pathToFileURL } from 'node:url';

// mulberry32: tiny seeded PRNG, so every learner gets the same log
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateLog() {
  const r = rng(20261001);
  const between = (lo, hi) => Math.round(lo + r() * (hi - lo));
  // Each endpoint has its own shape. Checkout is usually fast, but ~3% of calls
  // wait on a slow payment provider. Search is steady but never quick.
  const endpoints = [
    { method: 'GET', path: '/api/products', weight: 0.5, latency: () => (r() < 0.99 ? between(18, 70) : between(120, 260)) },
    { method: 'GET', path: '/api/search', weight: 0.25, latency: () => between(140, 230) + (r() < 0.05 ? between(50, 150) : 0) },
    { method: 'POST', path: '/api/checkout', weight: 0.25, latency: () => (r() < 0.968 ? between(35, 95) : between(1800, 3200)) },
  ];
  const lines = ['# access log: <timestamp> <method> <path> <status> <duration>ms', '# service: shop-api   host: shop-api-7d9f'];
  let t = Date.parse('2026-10-01T12:00:00.000Z');
  for (let i = 0; i < 4000; i++) {
    let pick = r();
    const ep = endpoints.find((e) => (pick -= e.weight) < 0) ?? endpoints[0];
    const ms = ep.latency();
    const status = ms > 3000 ? 504 : r() < 0.004 ? 500 : ep.method === 'POST' ? 201 : 200;
    t += between(5, 400);
    lines.push(`${new Date(t).toISOString()} ${ep.method} ${ep.path} ${status} ${ms}ms`);
  }
  return `${lines.join('\n')}\n`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) process.stdout.write(generateLog());
