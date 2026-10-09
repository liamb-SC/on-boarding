import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog(20000);
const here = path.dirname(fileURLToPath(import.meta.url));
const NAMES = ['report:load', 'report:aggregate', 'report:total'];

// The report the original, uninstrumented code produces.
const original = await import(path.join(here, 'starter/src/report.js'));
const expected = original.buildReport();
performance.clearMarks();
performance.clearMeasures();

let report, observe;
await check('src/report.js and src/observe.js load', async () => {
  report = await fromSandbox('./src/report.js');
  observe = await fromSandbox('./src/observe.js');
});

const seen = [];
let observer, result;
await check('watchMeasures() returns a PerformanceObserver', () => {
  observer = observe.watchMeasures((m) => seen.push(m));
  expect(observer instanceof PerformanceObserver, `it returned ${observer === undefined ? 'nothing' : typeof observer}`);
});

await check('buildReport() still returns the same totals', () => {
  result = report.buildReport();
  expectEqual(result, expected);
});

const measure = (name) => performance.getEntriesByName(name, 'measure');
const mark = (name) => performance.getEntriesByName(name, 'mark');

await check('it records marks report:start, report:loaded and report:end', () => {
  const missing = ['report:start', 'report:loaded', 'report:end'].filter((n) => mark(n).length !== 1);
  expect(!missing.length, `missing (or not exactly one per build): ${missing.join(', ')}`);
});

await check('it records measures report:load, report:aggregate and report:total, once per build', () => {
  const missing = NAMES.filter((n) => measure(n).length !== 1);
  expect(!missing.length, `missing (or not exactly one per build): ${missing.join(', ')}`);
});

await check('each measure spans the right marks', () => {
  const at = (n) => mark(n)[0]?.startTime;
  const [load, agg, total] = NAMES.map((n) => measure(n)[0]);
  expect(load && agg && total, 'add the three measures first');
  const near = (a, b) => Math.abs(a - b) < 0.5;
  expect(near(load.startTime, at('report:start')) && near(load.startTime + load.duration, at('report:loaded')),
    'report:load should go from report:start to report:loaded');
  expect(near(agg.startTime, at('report:loaded')) && near(agg.startTime + agg.duration, at('report:end')),
    'report:aggregate should go from report:loaded to report:end');
  expect(near(total.startTime, at('report:start')) && near(total.startTime + total.duration, at('report:end')),
    'report:total should go from report:start to report:end');
  expect(load.duration >= 100, `report:load took ${load.duration.toFixed(1)}ms: does report:loaded come after loadRows()?`);
});

await check('the observer reports every measure as { name, duration }', async () => {
  await new Promise((r) => setTimeout(r, 50)); // observers are notified asynchronously
  for (const n of NAMES) {
    const m = seen.find((x) => x?.name === n);
    expect(m, `onMeasure was never called for ${n}`);
    expect(typeof m.duration === 'number' && m.duration > 0, `${n} has no duration`);
  }
});

await check('after observer.disconnect(), nothing more is reported', async () => {
  expect(typeof observer?.disconnect === 'function', 'return the observer from watchMeasures() first');
  observer.disconnect();
  const before = seen.length;
  report.buildReport();
  await new Promise((r) => setTimeout(r, 50));
  expect(seen.length === before, 'onMeasure was still called after disconnect()');
});

let answers = {};
await check('answers.json is valid JSON', () => { answers = JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8')); });
await check('slowerStep: the measure that dominates report:total', () =>
  expect(String(answers.slowerStep ?? '').trim() === 'report:load', `"${answers.slowerStep}" is not it: run npm run report`));
await check('longTaskMs: the threshold for a "long task"', () =>
  expect(Number(answers.longTaskMs) === 50, `${answers.longTaskMs} is not it`));
await check('devtoolsTrack: where measures show in the Performance panel', () =>
  expect(String(answers.devtoolsTrack ?? '').trim().toLowerCase() === 'b', `"${answers.devtoolsTrack}" is not it`));
