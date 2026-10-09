import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();

// A fresh log directory the learner has never seen, so nothing can be hard-coded.
const dir = mkdtempSync(path.join(tmpdir(), 'onboard-logs-'));
writeFileSync(path.join(dir, 'a.log'), 'INFO ok\nERROR one\nERROR two\nINFO fine\n');
writeFileSync(path.join(dir, 'b.log'), 'ERROR three\n');
writeFileSync(path.join(dir, 'c.log'), '');
writeFileSync(path.join(dir, 'notes.txt'), 'ERROR not a log\nERROR still not\n');
mkdirSync(path.join(dir, 'archive.log')); // a directory, even though it ends in .log
writeFileSync(path.join(dir, 'archive.log', 'old.log'), 'ERROR old\n');

const cli = (...args) => spawnSync(process.execPath, ['cli.js', ...args], { cwd: SANDBOX, encoding: 'utf8', timeout: 10000 });

let stats;
await check('lib/stats.js is an ES module exporting countErrors and summarize', async () => {
  stats = await fromSandbox('./lib/stats.js');
  expect(typeof stats.countErrors === 'function', 'no named export countErrors');
  expect(typeof stats.summarize === 'function', 'no named export summarize');
});

await check('countErrors counts the lines that contain ERROR', () => {
  expectEqual(stats.countErrors('INFO a\nERROR b\nERROR c\n'), 2);
  expectEqual(stats.countErrors(''), 0, 'empty text: ');
  expectEqual(stats.countErrors('ERROR ERROR on one line\n'), 1, 'one line with two ERRORs: ');
});

await check('summarize(dir) returns a Promise (it uses async fs, not readFileSync)', () => {
  const p = stats.summarize(dir);
  p.catch(() => {});
  expect(p instanceof Promise, 'summarize should be async');
  const code = readFileSync(path.join(SANDBOX, 'lib/stats.js'), 'utf8');
  expect(!/\b\w+Sync\s*\(/.test(code), 'use fs/promises (await readdir/readFile), not the *Sync versions');
});

await check('summarize counts only regular *.log files directly in dir', async () => {
  expectEqual(await stats.summarize(dir), { files: 3, lines: 5, errors: 3 });
});

await check('`node cli.js <dir>` prints the summary as JSON and exits 0', () => {
  const r = cli(dir);
  expect(r.status === 0, `exit code ${r.status}: ${r.stderr}`);
  let out;
  try { out = JSON.parse(r.stdout); } catch { throw new Error(`stdout is not JSON: ${r.stdout.slice(0, 80)}`); }
  expectEqual(out, { files: 3, lines: 5, errors: 3 });
});

await check('cli.js gets its numbers by importing lib/stats.js', () => {
  const code = readFileSync(path.join(SANDBOX, 'cli.js'), 'utf8');
  expect(/import[\s\S]*from\s+['"]\.\/lib\/stats\.js['"]/.test(code), "import { summarize } from './lib/stats.js'");
});

await check('with no argument: usage on stderr, nothing on stdout, exit code 2', () => {
  const r = cli();
  expect(r.status === 2, `exit code ${r.status}`);
  expect(/usage/i.test(r.stderr), `stderr should contain "usage", got: ${r.stderr.trim().slice(0, 80)}`);
  expect(r.stdout.trim() === '', 'stdout should be empty');
});

await check('with a missing directory: an error on stderr (no stack trace) and exit code 1', () => {
  const r = cli(path.join(dir, 'nope'));
  expect(r.status === 1, `exit code ${r.status}`);
  expect(r.stderr.trim() !== '', 'say what went wrong on stderr');
  expect(!/\n\s+at /.test(r.stderr), 'print a short message, not an uncaught stack trace');
  expect(r.stdout.trim() === '', 'stdout should be empty');
});

rmSync(dir, { recursive: true, force: true });
