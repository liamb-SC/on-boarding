import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { run, tail, withCopy } from '../../mutants.mjs';

watchdog(180000);
const here = path.dirname(fileURLToPath(import.meta.url));
// Always test against the original cart.js, even if the learner edited theirs.
const original = readFileSync(path.join(here, 'starter/src/cart.js'), 'utf8');
const testFile = path.join(SANDBOX, 'src/cart.test.js');
const tests = existsSync(testFile) ? readFileSync(testFile, 'utf8') : '';
// The code without comments, so a TODO that mentions jest.fn() doesn't count.
const code = tests.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const jest = (dir) => run('node', ['node_modules/jest/bin/jest.js', '--ci', '--json', '--outputFile=.jest.json'], { cwd: dir })
  .then((r) => ({ ...r, json: JSON.parse(readFileSync(path.join(dir, '.jest.json'), 'utf8')) }))
  .catch((e) => ({ code: 1, out: String(e), json: null }));

// One small, plausible bug each. Good tests fail on every one of them.
const mutants = [
  ['subtotal ignores quantity', 'item.price * item.qty', 'item.price'],
  ['SAVE10 takes 20% off instead of 10%', 'amount * 0.9', 'amount * 0.8'],
  ['SAVE10 rounds down instead of to the nearest penny', 'Math.round(amount * 0.9)', 'Math.floor(amount * 0.9)'],
  ['FIVEOFF can go below zero', 'Math.max(0, amount - 500)', 'amount - 500'],
  ['unknown codes are silently ignored', 'throw new Error(`Unknown discount code: ${code}`);', 'return amount;'],
  ['checkout charges the price before the discount', 'customerId: cart.customerId, amount }', 'customerId: cart.customerId, amount: subtotal(cart.items) }'],
  ['an empty cart is charged anyway', "if (cart.items.length === 0) throw new Error('Cart is empty');", ''],
  ['payment errors are not wrapped in "Payment failed: ..."', 'throw new Error(`Payment failed: ${err.message}`);', 'throw err;'],
];

let real;
await check('src/cart.test.js exists', () => expect(tests, 'write your tests in src/cart.test.js'));

await check('your tests pass against the real cart.js', async () => {
  real = await withCopy({ 'src/cart.js': original }, jest);
  expect(real.json, `jest did not run: ${tail(real.out)}`);
  expect(real.code === 0, `some tests fail: ${tail(real.out)}`);
});

await check('there are at least 8 tests', () => {
  const n = real?.json?.numPassedTests ?? 0;
  expect(n >= 8, `found ${n} passing`);
});

await check('checkout is tested with a mock (jest.fn) and its calls are asserted', () => {
  expect(/jest\.fn\s*\(/.test(code), 'no jest.fn() found');
  expect(/toHaveBeenCalledWith|toHaveBeenCalledTimes|not\.toHaveBeenCalled|\.mock\.calls/.test(code),
    'assert on the mock, e.g. expect(payments.charge).toHaveBeenCalledWith(...)');
});

await check('a rejecting mock is used for the payment-failure case (mockRejectedValue)', () =>
  expect(/mockRejectedValue(Once)?\s*\(|mockImplementation(Once)?\s*\(/.test(code), 'no mockRejectedValue(...) found'));

for (const [desc, from, to] of mutants) {
  await check(`your tests catch the bug: ${desc}`, async () => {
    expect(original.includes(from), `internal: mutant does not apply (${desc})`);
    expect(real?.code === 0, 'make your tests pass against the real code first');
    const r = await withCopy({ 'src/cart.js': original.replace(from, to) }, jest);
    expect(r.code !== 0, 'every test still passed with this bug in cart.js');
  });
}
