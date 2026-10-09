#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

rm -rf "$SANDBOX_DIR" && mkdir -p "$SANDBOX_DIR"
node "$REPO_ROOT/tracks/observability/fixtures/latency.mjs" > "$SANDBOX_DIR/latency.log"

put package.json <<'JSON'
{
  "name": "latency-report",
  "private": true,
  "type": "module",
  "scripts": { "report": "node report.js" }
}
JSON

put percentiles.js <<'JS'
// Parse one access-log line, e.g.
//   2026-10-01T12:00:00.164Z GET /api/products 200 21ms
// into { method: 'GET', path: '/api/products', status: 200, ms: 21 } (numbers as numbers).
// Return null for comment lines (starting with #) and blank lines.
export function parseLine(line) {
  // TODO
}

// The p-th percentile (0 < p <= 100) of an array of numbers, using the
// nearest-rank method: sort ascending, then take the value at 1-based rank
// ceil(p / 100 * n). Don't modify the array you were given.
export function percentile(values, p) {
  // TODO
}
JS

put report.js <<'JS'
// npm run report — latency per endpoint, using your functions from percentiles.js
import { readFileSync } from 'node:fs';
import { parseLine, percentile } from './percentiles.js';

const byEndpoint = new Map();
for (const line of readFileSync(new URL('./latency.log', import.meta.url), 'utf8').split('\n')) {
  const req = parseLine(line);
  if (!req) continue;
  const key = `${req.method} ${req.path}`;
  if (!byEndpoint.has(key)) byEndpoint.set(key, []);
  byEndpoint.get(key).push(req.ms);
}

const rows = [...byEndpoint].map(([endpoint, ms]) => ({
  endpoint,
  count: ms.length,
  mean: +(ms.reduce((a, b) => a + b, 0) / ms.length).toFixed(1),
  p50: percentile(ms, 50),
  p95: percentile(ms, 95),
  p99: percentile(ms, 99),
  max: Math.max(...ms),
}));
console.table(rows);
JS

put answers.json <<'JSON'
{
  "checkout": { "mean": 0, "p50": 0, "p95": 0, "p99": 0 },
  "worst_mean": "",
  "worst_p99": "",
  "q_averages": "",
  "q_fanout": ""
}
JSON
