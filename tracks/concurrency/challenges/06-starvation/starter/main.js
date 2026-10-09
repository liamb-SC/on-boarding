// A "server" with a heartbeat that should tick every 10ms, while it builds a
// big report. Watch how long the heartbeat goes silent.
import { buildReport } from './report.js';

const rows = Array.from({ length: 300_000 }, (_, id) => ({ id }));

let last = performance.now();
let worstGap = 0;
let ticks = 0;
const heartbeat = setInterval(() => {
  const now = performance.now();
  worstGap = Math.max(worstGap, now - last);
  last = now;
  ticks++;
}, 10);

const t0 = performance.now();
const report = await buildReport(rows);
const ms = performance.now() - t0;
worstGap = Math.max(worstGap, performance.now() - last);
clearInterval(heartbeat);

console.log('report:', report, `in ${Math.round(ms)}ms`);
console.log(`heartbeat ticked ${ticks} times; longest silence ${Math.round(worstGap)}ms`);
console.log(worstGap > 100 ? 'STARVED: timers, I/O and requests were stuck behind the report' : 'responsive: the event loop kept turning');
