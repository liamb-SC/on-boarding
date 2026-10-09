// Static checks on .github/workflows/ci.yml. GitHub reads it the same way: YAML,
// then this structure. (`act` can run it locally, but needs Docker.)
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, fromSandbox, SANDBOX } from '../../../../lib/checks.mjs';

const { parse } = await fromSandbox('yaml');
let wf = {};
await check('.github/workflows/ci.yml is valid YAML', () => {
  wf = parse(readFileSync(path.join(SANDBOX, '.github/workflows/ci.yml'), 'utf8')) ?? {};
});

// `on:` can be a string, a list or a map. Normalise to a map.
const on = typeof wf.on === 'string' ? { [wf.on]: null }
  : Array.isArray(wf.on) ? Object.fromEntries(wf.on.map((e) => [e, null])) : (wf.on ?? {});
const job = wf.jobs?.test ?? {};
const steps = job.steps ?? [];
const idx = (pred) => steps.findIndex(pred);
const uses = (action) => (s) => typeof s.uses === 'string' && s.uses.startsWith(`${action}@`);
const runs = (re) => (s) => typeof s.run === 'string' && re.test(s.run);

await check('runs on push to main', () => {
  expect('push' in on, 'add a `push` trigger');
  const branches = on.push?.branches;
  expect(Array.isArray(branches) && branches.includes('main'), 'limit push to `branches: [main]` (PRs cover the rest)');
});
await check('runs on pull_request', () => expect('pull_request' in on, 'add a `pull_request` trigger'));
await check('the token is read-only: top-level permissions: { contents: read }', () =>
  expect(wf.permissions?.contents === 'read', `permissions is ${JSON.stringify(wf.permissions)}`));
await check('jobs.test runs on a matrix of Node 20 and 22', () => {
  const versions = (job.strategy?.matrix?.['node-version'] ?? []).map(String);
  expect(['20', '22'].every((v) => versions.some((x) => x === v || x.startsWith(`${v}.`))),
    `strategy.matrix.node-version is ${JSON.stringify(job.strategy?.matrix?.['node-version'])}`);
});
await check('checks out the code with actions/checkout@<version>', () =>
  expect(idx(uses('actions/checkout')) >= 0, 'add a step `uses: actions/checkout@v4`'));
await check('sets up Node from the matrix with actions/setup-node', () => {
  const s = steps[idx(uses('actions/setup-node'))];
  expect(s, 'add a step `uses: actions/setup-node@v4`');
  expect(String(s.with?.['node-version']).replace(/\s/g, '') === '${{matrix.node-version}}',
    'pass `with: { node-version: ${{ matrix.node-version }} }`');
});
await check('caches npm downloads (setup-node `cache: npm`, or actions/cache keyed on the lockfile)', () => {
  const viaSetupNode = steps.some((s) => uses('actions/setup-node')(s) && s.with?.cache === 'npm');
  const viaCache = steps.some((s) => uses('actions/cache')(s) && String(s.with?.key).includes('package-lock.json'));
  expect(viaSetupNode || viaCache, 'no npm cache configured');
});
await check('installs with `npm ci` (not npm install)', () =>
  expect(idx(runs(/\bnpm ci\b/)) >= 0 && idx(runs(/\bnpm (install|i)\b/)) < 0, 'CI should install exactly what the lockfile says'));
await check('runs the tests (`npm test`)', () => expect(idx(runs(/\bnpm (run )?test\b/)) >= 0, 'add a step `run: npm test`'));
await check('steps are in order: checkout → setup-node → npm ci → npm test', () => {
  const order = [idx(uses('actions/checkout')), idx(uses('actions/setup-node')), idx(runs(/\bnpm ci\b/)), idx(runs(/\bnpm (run )?test\b/))];
  expect(order.every((n, i) => n >= 0 && (i === 0 || n > order[i - 1])), `step positions: ${order.join(', ')}`);
});
await check('actions are pinned to a version (no @main / @master)', () => {
  const floating = steps.filter((s) => /@(main|master)$/.test(s.uses ?? '')).map((s) => s.uses);
  expect(steps.some((s) => s.uses), 'no `uses:` steps yet');
  expect(!floating.length, `floating refs: ${floating.join(', ')}`);
});
