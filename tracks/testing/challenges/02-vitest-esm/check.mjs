import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { run, tail, withCopy } from '../../mutants.mjs';

watchdog(240000);
const here = path.dirname(fileURLToPath(import.meta.url));
// Always test against the original source, even if the learner edited theirs.
const original = Object.fromEntries(['src/retry.js', 'src/weather.js', 'src/http.js']
  .map((f) => [f, readFileSync(path.join(here, 'starter', f), 'utf8')]));
const read = (f) => (existsSync(path.join(SANDBOX, f)) ? readFileSync(path.join(SANDBOX, f), 'utf8') : '');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const retryTests = strip(read('test/retry.test.js'));
const weatherTests = strip(read('test/weather.test.js'));

const vitest = (dir) => run('node', ['node_modules/vitest/vitest.mjs', 'run', '--reporter=json', '--outputFile=.vitest.json'], { cwd: dir })
  .then((r) => {
    let json = null;
    try { json = JSON.parse(readFileSync(path.join(dir, '.vitest.json'), 'utf8')); } catch {}
    return { ...r, json };
  });

// Name the failing tests (or the file-level error) instead of dumping output.
const failures = (r) => {
  const bad = (r.json?.testResults ?? []).flatMap((f) => [
    ...(f.message ? [`${path.basename(f.name)}: ${f.message.split('\n')[0]}`] : []),
    ...f.assertionResults.filter((a) => a.status === 'failed').map((a) => a.fullName),
  ]);
  return bad.length ? bad.slice(0, 3).join(' | ') : tail(r.out);
};

// One small, plausible bug each. Good tests fail on every one of them.
const mutants = [
  ['retry makes one attempt too few', 'src/retry.js', 'attempt <= attempts', 'attempt < attempts'],
  ['retry returns undefined instead of throwing when every attempt fails', 'src/retry.js', 'throw lastError;', 'return undefined;'],
  ['retry does not call onRetry', 'src/retry.js', 'if (attempt < attempts) onRetry(err, attempt);', ''],
  ['retry also calls onRetry after the final failure', 'src/retry.js', 'if (attempt < attempts) onRetry', 'onRetry'],
  ['currentTemp does not URL-encode the city', 'src/weather.js', 'encodeURIComponent(city)', 'city'],
  ['currentTemp rounds down instead of to the nearest degree', 'src/weather.js', 'Math.round(', 'Math.floor('],
  ['currentTemp gives up after one failed attempt', 'src/weather.js', 'attempts: 2', 'attempts: 1'],
];

let real;
await check('test/retry.test.js and test/weather.test.js exist', () =>
  expect(retryTests && weatherTests, 'keep your tests in those two files'));

await check('your tests pass against the real code', async () => {
  real = await withCopy(original, vitest);
  expect(real.json, `vitest did not run: ${tail(real.out)}`);
  expect(real.code === 0, `failing: ${failures(real)}`);
});

await check('there are at least 7 tests', () => {
  const n = real?.json?.numPassedTests ?? 0;
  expect(n >= 7, `found ${n} passing`);
});

await check('retry is tested with vi.fn() mocks that fail then succeed', () => {
  expect(/vi\.fn\s*\(/.test(retryTests), 'no vi.fn() in test/retry.test.js');
  expect(/mockRejectedValueOnce|mockImplementation/.test(retryTests),
    'make a mock fail on some calls, e.g. vi.fn().mockRejectedValueOnce(err).mockResolvedValue(x)');
});

await check('weather tests mock the http module with vi.mock(...)', () =>
  expect(/vi\.mock\s*\(\s*['"`][^'"`]*http(\.js)?['"`]/.test(weatherTests), "no vi.mock('../src/http.js') in test/weather.test.js"));

for (const [desc, file, from, to] of mutants) {
  await check(`your tests catch the bug: ${desc}`, async () => {
    expect(original[file].includes(from), `internal: mutant does not apply (${desc})`);
    expect(real?.code === 0, 'make your tests pass against the real code first');
    const r = await withCopy({ ...original, [file]: original[file].replace(from, to) }, vitest);
    expect(r.code !== 0, `every test still passed with this bug in ${file}`);
  });
}
