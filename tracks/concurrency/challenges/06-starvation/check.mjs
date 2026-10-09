import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { within } from '../../sched.mjs';

watchdog(90000);
const { score } = await fromSandbox('./score.js');
const { buildReport } = await fromSandbox('./report.js');

// Size the job to this machine: enough rows that doing them all in one go
// blocks the event loop for at least ~400ms.
let rows; let syncMs;
for (let n = 25_000; ; n *= 2) {
  rows = Array.from({ length: n }, (_, id) => ({ id }));
  const t0 = performance.now();
  let total = 0;
  for (const row of rows) total += score(row);
  syncMs = performance.now() - t0;
  if (syncMs >= 400 || n >= 6_400_000) { rows.expected = { count: n, total }; break; }
}

// Run buildReport while a 5ms timer measures the longest gap between ticks.
let last; let worstGap = 0; let ticks = 0; let result; let ms;
await check('buildReport still returns the right { count, total }', async () => {
  last = performance.now();
  const timer = setInterval(() => {
    const now = performance.now();
    worstGap = Math.max(worstGap, now - last);
    last = now;
    ticks++;
  }, 5);
  const t0 = performance.now();
  try {
    result = await within(Math.max(20000, syncMs * 20), buildReport(rows), 'buildReport');
  } finally {
    const end = performance.now();
    ms = end - t0;
    worstGap = Math.max(worstGap, end - last); // the silence up to the finish counts too
    clearInterval(timer);
  }
  expectEqual(result, rows.expected);
});

await check('timers keep firing while the report builds (no gap over 75ms)', () => {
  expect(result, 'buildReport did not finish');
  expect(worstGap < 75, `the event loop was blocked for ${Math.round(worstGap)}ms at a stretch (a sync run takes ${Math.round(syncMs)}ms); yield with setImmediate, not a microtask`);
});

await check('it doesn\'t crawl: yielding costs well under 2x the work itself', () => {
  expect(result, 'buildReport did not finish');
  const budget = syncMs * 2 + 300;
  expect(ms < budget, `took ${Math.round(ms)}ms vs ${Math.round(syncMs)}ms of real work; yield every few thousand rows, not every row`);
});

await check('report.js still uses score.js (the work is not skipped)', () => {
  const code = readFileSync(path.join(SANDBOX, 'report.js'), 'utf8');
  expect(/score\s*\(/.test(code), 'call score(row) for each row');
});

const answers = (() => {
  try { return JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8')); } catch { return {}; }
})();
const norm = (v) => String(v ?? '').trim().toLowerCase().replace(/[^a-z]/g, '');
await check('answers.json q1: why `await Promise.resolve()` between chunks is not enough', () => {
  expect(norm(answers.q1), 'answer with a, b or c');
  expect(norm(answers.q1) === 'b', 'not quite: try it, and look at when microtasks run relative to timers');
});
await check('answers.json q2: which change stops a busy queue from starving low-priority jobs', () => {
  expect(norm(answers.q2), 'answer with a, b or c');
  expect(norm(answers.q2) === 'c', 'not quite: what guarantees an old job eventually wins?');
});
