import { spawn } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, fromSandbox, stage, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog(30000);

// Run the reference app and cache server (validator-owned copies) with the
// learner's shared-cache.js dropped in.
const here = path.dirname(fileURLToPath(import.meta.url));
const staged = stage(path.join(here, 'starter'), 'price-service');
const stagedDir = path.join(SANDBOX, staged);
copyFileSync(path.join(SANDBOX, 'shared-cache.js'), path.join(stagedDir, 'shared-cache.js'));

const children = [];
process.on('exit', () => children.forEach((c) => c.kill()));
function start(file, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(stagedDir, file)], {
      env: { ...process.env, PORT: '0', ...env }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    children.push(child);
    let err = '';
    child.stderr.on('data', (d) => { err += d; });
    child.stdout.on('data', (d) => { const m = /listening on (\d+)/.exec(d); if (m) resolve(Number(m[1])); });
    child.on('exit', (code) => reject(new Error(`${file} exited (${code}): ${err}`)));
  });
}

const cachePort = await start('cache-server.js', {});
const CACHE_URL = `http://127.0.0.1:${cachePort}`;
const { createSharedCache } = await fromSandbox(`${staged}/shared-cache.js`);

await check('shared cache: set then get round-trips a value through the server', async () => {
  const cache = createSharedCache(CACHE_URL);
  const missing = await cache.get('nope');
  expect(missing === undefined || missing === null, `get on a missing key returned ${JSON.stringify(missing)}`);
  await cache.set('k1', { price: 42 });
  const v = await createSharedCache(CACHE_URL).get('k1'); // a second client, as in another process
  expect(v?.price === 42, `got ${JSON.stringify(v)}`);
});

await check('shared cache: del removes the key for every client', async () => {
  await createSharedCache(CACHE_URL).set('k2', 7);
  expect(await createSharedCache(CACHE_URL).get('k2') === 7, 'set/get does not work yet');
  await createSharedCache(CACHE_URL).del('k2');
  const v = await createSharedCache(CACHE_URL).get('k2');
  expect(v === undefined || v === null, `still got ${JSON.stringify(v)}`);
});

await check('shared cache: uses CACHE_URL from the environment by default', () => {
  const src = readFileSync(path.join(SANDBOX, 'shared-cache.js'), 'utf8');
  expect(/process\.env\.CACHE_URL/.test(src), 'keep the default url = process.env.CACHE_URL');
});

// Two app processes, one database, one shared cache.
const dbFile = path.join(mkdtempSync(path.join(tmpdir(), 'onboard-prices-')), 'db.json');
const env = { CACHE: 'shared', CACHE_URL, DB_FILE: dbFile };
const [a, b] = await Promise.all([start('server.js', env), start('server.js', env)]);
const url = (port) => `http://127.0.0.1:${port}/price/sku-1`;
const get = async (port) => (await fetch(url(port))).json();

await check('two processes with CACHE=shared: a value A cached is a cache hit on B', async () => {
  await get(a);
  const fromB = await get(b);
  expect(fromB.from === 'cache' && fromB.price === 10, `B returned ${JSON.stringify(fromB)}`);
});

await check('two processes with CACHE=shared: an update through A is seen by B', async () => {
  await get(b);
  await fetch(url(a), { method: 'PUT', body: JSON.stringify({ price: 12 }) });
  const after = await get(b);
  expect(after.price === 12, `B returned ${JSON.stringify(after)}`);
});

// Answers live here, not in the sandbox.
const EXPECTED = {
  'country-list': 'local',
  'feature-flags': 'shared',
  'user-sessions': 'shared',
  'product-stock': 'shared',
  'parsed-config-templates': 'local',
};
let answers = {};
try { answers = JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8')); } catch {}
for (const [key, want] of Object.entries(EXPECTED)) {
  await check(`answers.json: ${key}`, () => {
    const got = String(answers[key] ?? '').trim().toLowerCase();
    expect(got === 'local' || got === 'shared', 'answer "local" or "shared"');
    expect(got === want, 'not quite. Think about how often it changes and whether every instance must agree');
  });
}
process.exit(0);
