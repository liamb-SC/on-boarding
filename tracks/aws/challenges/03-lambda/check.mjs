import { check, expect, expectEqual, watchdog } from '../../../../lib/checks.mjs';
import { config, done, gradeAnswers, notFound, readAnswers, sdk } from '../../fixtures/validator.mjs';

watchdog(180000); // the first invoke can pull LocalStack's Node runtime image
const { LambdaClient, GetFunctionCommand, InvokeCommand } = await sdk('lambda');
const lambda = new LambdaClient(config);
const FunctionName = 'order-total';

async function invoke(event) {
  const res = await lambda.send(new InvokeCommand({ FunctionName, Payload: JSON.stringify(event) }));
  const text = new TextDecoder().decode(res.Payload ?? new Uint8Array());
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { error: res.FunctionError, body };
}

let fn;
await check(`the function ${FunctionName} is deployed`, async () => {
  try {
    fn = (await lambda.send(new GetFunctionCommand({ FunctionName }))).Configuration;
  } catch (e) {
    throw new Error(notFound(e) ? 'not found — run node deploy.mjs' : e.message);
  }
});

await check('it uses a Node.js runtime and the handler index.handler', () => {
  expect(fn, 'no function');
  expect(/^nodejs(20|22|24)\.x$/.test(fn.Runtime ?? ''), `runtime is ${fn.Runtime}`);
  expect(fn.Handler === 'index.handler', `handler is ${fn.Handler}`);
});

await check('it is Active (deploy.mjs waits for it)', () => {
  expect(fn, 'no function');
  expect(!fn.State || fn.State === 'Active', `state is ${fn.State}`);
});

await check('invoking it with an order returns the right count and total', async () => {
  expect(fn, 'no function');
  const items = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, (_, i) => ({
    sku: `SKU-${i}`,
    qty: 1 + Math.floor(Math.random() * 4),
    price: Math.round(Math.random() * 5000) / 100,
  }));
  const want = {
    count: items.reduce((n, it) => n + it.qty, 0),
    total: Math.round(items.reduce((n, it) => n + it.qty * it.price, 0) * 100) / 100,
  };
  const { error, body } = await invoke({ items });
  expect(!error, `the function threw: ${body?.errorMessage ?? JSON.stringify(body)}`);
  expectEqual(body, want);
});

await check('an empty order returns { count: 0, total: 0 }', async () => {
  expect(fn, 'no function');
  const { error, body } = await invoke({ items: [] });
  expect(!error, `the function threw: ${body?.errorMessage ?? JSON.stringify(body)}`);
  expectEqual(body, { count: 0, total: 0 });
});

await check('a payload without items makes the function throw (FunctionError is set)', async () => {
  expect(fn, 'no function');
  const { error } = await invoke({ hello: 'world' });
  expect(error, 'the invoke succeeded; throw an Error when items is missing');
});

await check('gcf.json: Lambda vs Cloud Functions answers', () =>
  gradeAnswers(readAnswers('gcf.json'), {
    'handler-signature': 'c',
    concurrency: 'b',
    'max-http-timeout': 'a',
    'event-triggers': 'c',
    'built-on': 'a',
    'cold-starts': 'b',
  }));

done();
