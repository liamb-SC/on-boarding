// Helpers shared by the React track's check.mjs validators.
//
// runSpec() stages a validator-owned Vitest file into the sandbox, runs it
// against the learner's code (jsdom + Testing Library), and turns every test
// into one ✓/✗ line. The spec is copied fresh on each run and removed after,
// so the learner can read it in the repo but can't edit what they're graded on.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { check, SANDBOX } from '../../lib/checks.mjs';

const STAGE = '.onboard-tests';

// The validator's own Vitest config, so a learner's vite.config.js can't
// change how (or whether) the spec runs.
const CONFIG = `export default {
  root: ${JSON.stringify(SANDBOX)},
  esbuild: { jsx: 'automatic' },
  logLevel: 'silent',
  test: {
    environment: 'jsdom',
    include: ['${STAGE}/**/*.test.{js,jsx}'],
    exclude: [],
    watch: false,
    testTimeout: 10000,
  },
};
`;

const firstLines = (s, n = 3) => String(s ?? '')
  .replace(/\x1b\[[0-9;]*m/g, '')
  .replace(/^\w*Error: /, '')
  .split('\n').map((l) => l.trim()).filter(Boolean).slice(0, n).join(' ')
  // Testing Library appends long advice to "Unable to find..." errors; keep the gist.
  .replace(/\. (This could be|There are no|Here are the|Ignored nodes).*$/, '.');

export async function runSpec(specFile) {
  const dir = path.join(SANDBOX, STAGE);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  cpSync(specFile, path.join(dir, path.basename(specFile)));
  writeFileSync(path.join(dir, 'vitest.config.mjs'), CONFIG);
  const out = path.join(dir, 'result.json');

  const bin = path.join(SANDBOX, 'node_modules/vitest/vitest.mjs');
  const ran = spawnSync(process.execPath, [bin, 'run', '--config', `${STAGE}/vitest.config.mjs`,
    '--reporter=json', `--outputFile=${STAGE}/result.json`], {
    cwd: SANDBOX, encoding: 'utf8', timeout: 120000, env: { ...process.env, CI: '1', FORCE_COLOR: '0' },
  });

  let report;
  try { report = JSON.parse(readFileSync(out, 'utf8')); } catch { /* reported below */ }
  rmSync(dir, { recursive: true, force: true });

  if (!report) {
    await check('the tests ran', () => {
      throw new Error(existsSync(bin) ? firstLines(ran.stderr || ran.stdout || ran.error, 4)
        : 'vitest is not installed in the sandbox. Run ./onboard reset');
    });
    return;
  }
  for (const file of report.testResults) {
    // A file that fails to import (syntax error, missing export...) has no tests.
    if (!file.assertionResults.length) {
      await check('your code loads without errors', () => { throw new Error(firstLines(file.message, 4)); });
      continue;
    }
    for (const t of file.assertionResults) {
      await check(t.title, () => {
        if (t.status !== 'passed') throw new Error(firstLines(t.failureMessages?.[0], 1) || t.status);
      });
    }
  }
}
