import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { within } from '../../sched.mjs';

watchdog(60000);
const PROBE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'probe-worker.mjs');
const { WorkerPool } = await fromSandbox('./pool.js');

// Run `count` probe tasks on a pool of `size`; returns results + peak concurrency.
async function batch(size, count, ms = 40) {
  const pool = new WorkerPool(size, PROBE);
  const shared = new SharedArrayBuffer(8);
  try {
    const results = await within(10000, Promise.all(
      Array.from({ length: count }, (_, i) => pool.run({ shared, ms, value: i }))), `${count} tasks`);
    return { results, peak: new Int32Array(shared)[1], pool };
  } finally {
    await within(5000, Promise.resolve(pool.close()), 'close()').catch(() => {});
  }
}

let run3;
await check('run() resolves with each task\'s result, in the right order', async () => {
  run3 = await batch(3, 12);
  expectEqual(run3.results.map((r) => r?.value), Array.from({ length: 12 }, (_, i) => i * 2));
});

await check('a pool of 3 never runs more than 3 tasks at once (extra tasks queue)', () => {
  expect(run3, 'the tasks did not complete');
  expect(run3.peak <= 3, `${run3.peak} tasks ran at the same time`);
});

await check('a pool of 3 really runs tasks in parallel', () => {
  expect(run3, 'the tasks did not complete');
  expect(run3.peak >= 2, `only ${run3.peak} task ran at a time: hand queued tasks to idle workers`);
});

await check('workers are reused: 12 tasks ran on at most 3 threads', () => {
  expect(run3, 'the tasks did not complete');
  const threads = new Set(run3.results.map((r) => r.threadId));
  expect(threads.size <= 3, `${threads.size} different threads were used: start the workers once, not per task`);
});

await check('a pool of 1 runs tasks one at a time', async () => {
  const { peak, results } = await batch(1, 4, 10);
  expectEqual(results.length, 4);
  expectEqual(peak, 1, 'peak concurrency: ');
});

await check('a task that replies { error } rejects, and the pool keeps working', async () => {
  const pool = new WorkerPool(2, PROBE);
  const shared = new SharedArrayBuffer(8);
  try {
    const err = await within(5000, pool.run({ shared, ms: 1, value: 7, fail: true }).then(() => null, (e) => e), 'the failing task');
    expect(err instanceof Error && err.message === 'task 7 failed', err ? `rejected with ${err.message ?? err}` : 'it resolved');
    const after = await within(5000, Promise.all([1, 2, 3].map((value) => pool.run({ shared, ms: 1, value }))), 'tasks after the failure');
    expectEqual(after.map((r) => r.value), [2, 4, 6]);
  } finally {
    await within(5000, Promise.resolve(pool.close()), 'close()').catch(() => {});
  }
});

await check('close() terminates the workers, so the process can exit', () => {
  const script = `
    import { WorkerPool } from ${JSON.stringify(pathToFileURL(path.join(SANDBOX, 'pool.js')).href)};
    const pool = new WorkerPool(2, ${JSON.stringify(PROBE)});
    await pool.run({ shared: new SharedArrayBuffer(8), ms: 1, value: 1 });
    await pool.close();
  `;
  // A real file, not `node -e`: workers inherit the parent's execArgv.
  const dir = mkdtempSync(path.join(tmpdir(), 'onboard-pool-'));
  writeFileSync(path.join(dir, 'close.mjs'), script);
  const r = spawnSync(process.execPath, [path.join(dir, 'close.mjs')], { timeout: 5000, encoding: 'utf8' });
  rmSync(dir, { recursive: true, force: true });
  expect(r.error?.code !== 'ETIMEDOUT', 'the process was still running 5s after close(): terminate() every worker');
  expect(r.status === 0, `the script failed: ${r.stderr.trim().split('\n').pop()}`);
});

await check('you ran `npm run observe` (observations.json exists)', () => {
  const file = path.join(SANDBOX, 'observations.json');
  expect(existsSync(file), 'run npm run observe and look at the table');
  const { rows } = JSON.parse(readFileSync(file, 'utf8'));
  expect(rows?.length === 2 && rows.every((r) => Number.isInteger(r.involuntary)), 'observations.json looks wrong; re-run npm run observe');
});

const answers = (() => {
  try { return JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8')); } catch { return {}; }
})();
const norm = (v) => String(v ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
for (const [q, want, desc, nudge] of [
  ['q1', 'a', 'a sensible size for a CPU-bound pool', 'more threads than cores cannot run at the same time'],
  ['q2', 'b', 'which context switches extra CPU-bound threads cause', 'nobody is waiting on I/O here; who stops a thread that never yields?'],
  ['q3', '2', 'how many waves 8 pbkdf2 calls finish in', 'run npm run uv-pool and look at the finish times'],
]) {
  await check(`answers.json ${q}: ${desc}`, () => {
    expect(norm(answers[q]), `fill in ${q}`);
    expect(norm(answers[q]) === want, `not quite: ${nudge}`);
  });
}
