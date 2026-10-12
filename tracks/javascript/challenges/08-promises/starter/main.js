import { flaky, mirror } from './services.js';
import { firstAvailable, readConfigAsync, retry, withTimeout } from './promises.js';

// Node would normally crash here. Log instead so you can see every symptom.
process.on('unhandledRejection', (e) => console.log('  !! unhandled rejection:', e.message, '(expected: none)'));

const show = (label, p) =>
  p.then((v) => console.log(label, '->', v), (e) => console.log(label, '-> rejected:', e.message));

await show('readConfigAsync("app")', readConfigAsync('app'));
await show('readConfigAsync("nope")', readConfigAsync('nope')); // expected: rejected

await show('retry(fails twice, 3 attempts)', retry(flaky(2), 3, 20)); // expected: ok on attempt 3
await show('retry(fails 5 times, 2 attempts)', retry(flaky(5), 2, 20)); // expected: rejected, attempt 2 failed

const t = Date.now();
await show('withTimeout(fast, 3000)', withTimeout(Promise.resolve('fast'), 3000));
await show('withTimeout(slow, 20)', withTimeout(mirror('slow', 200)('a.zip'), 20)); // expected: rejected

const mirrors = [mirror('eu', 10, false), mirror('us', 30), mirror('asia', 60)];
await show('firstAvailable', firstAvailable(mirrors, 'a.zip')); // expected: a.zip from us

process.on('exit', () => console.log(`exited after ${Date.now() - t}ms (expected: well under 3000ms)`));
