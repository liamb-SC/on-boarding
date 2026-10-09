import { check, expect, watchdog } from '../../../../lib/checks.mjs';
import { config, done, ENDPOINT, nonce, notFound, sdk } from '../../fixtures/validator.mjs';

watchdog(180000); // the first request can pull LocalStack's Node runtime image
const gw = await sdk('api-gateway');
const lam = await sdk('lambda');
const apigw = new gw.APIGatewayClient(config);
const lambda = new lam.LambdaClient(config);

let fn;
await check('the function hello-fn is deployed', async () => {
  try {
    fn = (await lambda.send(new lam.GetFunctionCommand({ FunctionName: 'hello-fn' }))).Configuration;
  } catch (e) {
    throw new Error(notFound(e) ? 'not found — run node deploy-function.mjs' : e.message);
  }
});

let api;
await check('there is exactly one REST API named hello-api', async () => {
  const { items = [] } = await apigw.send(new gw.GetRestApisCommand({ limit: 500 }));
  const apis = items.filter((a) => a.name === 'hello-api');
  expect(apis.length === 1, `found ${apis.length}`);
  [api] = apis;
});

let resource;
let integration;
await check('it has a GET method on /hello', async () => {
  expect(api, 'no API');
  const { items = [] } = await apigw.send(new gw.GetResourcesCommand({ restApiId: api.id, limit: 500 }));
  resource = items.find((r) => r.path === '/hello');
  expect(resource, 'no /hello resource');
  const method = await apigw.send(new gw.GetMethodCommand({ restApiId: api.id, resourceId: resource.id, httpMethod: 'GET' }))
    .catch(() => null);
  expect(method, 'no GET method on /hello');
  integration = method.methodIntegration ?? await apigw.send(new gw.GetIntegrationCommand({
    restApiId: api.id, resourceId: resource.id, httpMethod: 'GET',
  })).catch(() => null);
});

await check('GET /hello is a Lambda proxy integration (AWS_PROXY) pointing at hello-fn', () => {
  expect(integration, 'no integration on GET /hello');
  expect(integration.type === 'AWS_PROXY', `integration type is ${integration.type}`);
  expect(fn && integration.uri?.includes(`/functions/${fn.FunctionArn}/invocations`), `uri is ${integration.uri}`);
});

await check('hello-fn lets apigateway.amazonaws.com invoke it (AddPermission)', async () => {
  expect(fn, 'no function');
  let policy;
  try {
    policy = (await lambda.send(new lam.GetPolicyCommand({ FunctionName: 'hello-fn' }))).Policy;
  } catch (e) {
    throw new Error(notFound(e) ? 'the function has no resource policy yet' : e.message);
  }
  const statements = [].concat(JSON.parse(policy).Statement ?? []);
  expect(statements.some((s) => JSON.stringify(s.Principal ?? '').includes('apigateway.amazonaws.com') &&
    [].concat(s.Action).includes('lambda:InvokeFunction')), 'no statement for apigateway.amazonaws.com');
});

await check('the API is deployed to the stage dev', async () => {
  expect(api, 'no API');
  try {
    await apigw.send(new gw.GetStageCommand({ restApiId: api.id, stageName: 'dev' }));
  } catch (e) {
    throw new Error(notFound(e) ? 'no dev stage — CreateDeployment with stageName "dev"' : e.message);
  }
});

const url = (qs = '') => `${ENDPOINT}/restapis/${api?.id}/dev/_user_request_/hello${qs}`;
async function call(qs) {
  const res = await fetch(url(qs), { signal: AbortSignal.timeout(120000) });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: res.status, type: res.headers.get('content-type') ?? '', text, json };
}

await check('GET /hello?name=<name> returns 200 with { message: "Hello, <name>!" } as JSON', async () => {
  expect(api, 'no API');
  const who = nonce('Ada');
  const r = await call(`?name=${who}`);
  expect(r.status === 200, `HTTP ${r.status}: ${r.text.slice(0, 120)}`);
  expect(r.type.includes('application/json'), `content-type is "${r.type}"`);
  expect(r.json?.message === `Hello, ${who}!`, `body was ${r.text.slice(0, 120)}`);
});

await check('GET /hello without a name returns 400 with { error: "name is required" }', async () => {
  expect(api, 'no API');
  const r = await call('');
  expect(r.status === 400, `HTTP ${r.status}: ${r.text.slice(0, 120)}`);
  expect(r.json?.error === 'name is required', `body was ${r.text.slice(0, 120)}`);
});

done();
