import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';
import { config, done, nonce, notFound, sdk } from '../../fixtures/validator.mjs';

watchdog(60000);
const iamSdk = await sdk('iam');
const smSdk = await sdk('secrets-manager');
const ssmSdk = await sdk('ssm');
const iam = new iamSdk.IAMClient(config);
const sm = new smSdk.SecretsManagerClient(config);
const ssm = new ssmSdk.SSMClient(config);
const RoleName = 'orders-config-reader';
const ACCOUNT = '000000000000';
const paramArn = (name) => `arn:aws:ssm:us-east-1:${ACCOUNT}:parameter${name}`;
const secretArnFor = (name) => `arn:aws:secretsmanager:us-east-1:${ACCOUNT}:secret:${name}-Xy12Ab`;

// IAM returns policy documents URL-encoded (LocalStack may not).
const parseDoc = (doc) => {
  if (typeof doc !== 'string') return doc;
  try { return JSON.parse(doc); } catch { return JSON.parse(decodeURIComponent(doc)); }
};
const list = (v) => [].concat(v ?? []);

let secretArn;
await check('secret orders/db holds JSON with username "orders_app" and a password', async () => {
  let value;
  try {
    secretArn = (await sm.send(new smSdk.DescribeSecretCommand({ SecretId: 'orders/db' }))).ARN;
    value = (await sm.send(new smSdk.GetSecretValueCommand({ SecretId: 'orders/db' }))).SecretString;
  } catch (e) {
    throw new Error(notFound(e) ? 'not found — run node store.mjs' : e.message);
  }
  let parsed;
  try { parsed = JSON.parse(value); } catch { throw new Error('SecretString is not JSON'); }
  expect(parsed.username === 'orders_app', `username is ${JSON.stringify(parsed.username)}`);
  expect(typeof parsed.password === 'string' && parsed.password.length >= 16, 'password should be a string of 16+ characters');
});

const paramType = async (Name) => {
  try {
    return (await ssm.send(new ssmSdk.GetParameterCommand({ Name }))).Parameter;
  } catch (e) {
    throw new Error(notFound(e) || e.name === 'ParameterNotFound' ? `${Name} not found — run node store.mjs` : e.message);
  }
};
await check('/orders/page-size is a String parameter', async () => {
  const p = await paramType('/orders/page-size');
  expect(p.Type === 'String', `type is ${p.Type}`);
});
await check('/orders/api-key is a SecureString parameter', async () => {
  const p = await paramType('/orders/api-key');
  expect(p.Type === 'SecureString', `type is ${p.Type}`);
});

let role;
await check(`role ${RoleName} exists`, async () => {
  try {
    role = (await iam.send(new iamSdk.GetRoleCommand({ RoleName }))).Role;
  } catch (e) {
    throw new Error(notFound(e) ? 'not found — run node role.mjs' : e.message);
  }
});

await check('only lambda.amazonaws.com may assume it (trust policy)', () => {
  expect(role, 'no role');
  const stmts = list(parseDoc(role.AssumeRolePolicyDocument).Statement).filter((s) => s.Effect === 'Allow');
  expect(stmts.length, 'the trust policy allows nobody');
  for (const s of stmts) {
    expectEqual(Object.keys(s.Principal ?? {}), ['Service'], 'principal kinds: ');
    expectEqual(list(s.Principal.Service), ['lambda.amazonaws.com'], 'trusted services: ');
    expect(list(s.Action).every((a) => a === 'sts:AssumeRole'), `actions: ${list(s.Action).join(', ')}`);
  }
});

// Every Allow statement from the role's inline and attached policies.
let statements = [];
await check('it has the inline policy read-orders-config', async () => {
  expect(role, 'no role');
  const { PolicyNames = [] } = await iam.send(new iamSdk.ListRolePoliciesCommand({ RoleName }));
  expect(PolicyNames.includes('read-orders-config'), `inline policies: ${PolicyNames.join(', ') || 'none'}`);
  for (const PolicyName of PolicyNames) {
    const { PolicyDocument } = await iam.send(new iamSdk.GetRolePolicyCommand({ RoleName, PolicyName }));
    statements.push(...list(parseDoc(PolicyDocument).Statement));
  }
  const { AttachedPolicies = [] } = await iam.send(new iamSdk.ListAttachedRolePoliciesCommand({ RoleName }));
  for (const { PolicyArn } of AttachedPolicies) {
    const { Policy } = await iam.send(new iamSdk.GetPolicyCommand({ PolicyArn }));
    const { PolicyVersion } = await iam.send(new iamSdk.GetPolicyVersionCommand({ PolicyArn, VersionId: Policy.DefaultVersionId }));
    statements.push(...list(parseDoc(PolicyVersion.Document).Statement));
  }
  statements = statements.filter((s) => s.Effect === 'Allow');
});

// A tiny policy evaluator: does any Allow statement match action + resource?
const glob = (pattern, value, flags = '') =>
  new RegExp(`^${pattern.split('').map((c) => (c === '*' ? '.*' : c === '?' ? '.' : c.replace(/[.+^${}()|[\]\\/]/g, '\\$&'))).join('')}$`, flags).test(value);
const allows = (action, resource) => statements.some((s) =>
  !s.NotAction && !s.NotResource &&
  list(s.Action).some((a) => glob(a, action, 'i')) &&
  list(s.Resource).some((r) => glob(r, resource)));

await check('no wildcard actions ("*" or "service:*") and no "Resource": "*"', () => {
  expect(statements.length, 'no Allow statements');
  for (const s of statements) {
    expect(!s.NotAction && !s.NotResource, 'avoid NotAction / NotResource');
    const wild = list(s.Action).filter((a) => a.includes('*'));
    expect(!wild.length, `wildcard actions: ${wild.join(', ')}`);
    expect(!list(s.Resource).includes('*'), `statement ${s.Sid ?? ''} has "Resource": "*"`);
  }
});

await check('the policy lets the role read the orders/db secret and both /orders parameters', () => {
  expect(secretArn, 'no secret');
  expect(allows('secretsmanager:GetSecretValue', secretArn), `secretsmanager:GetSecretValue on ${secretArn} is not allowed`);
  for (const p of ['/orders/page-size', '/orders/api-key']) {
    expect(allows('ssm:GetParameter', paramArn(p)) || allows('ssm:GetParameters', paramArn(p)),
      `ssm:GetParameter on ${paramArn(p)} is not allowed`);
  }
});

await check('...and nothing more (no writes, no other secrets or parameters, no other services)', () => {
  expect(statements.length, 'no Allow statements');
  const forbidden = [
    ['secretsmanager:PutSecretValue', secretArn ?? secretArnFor('orders/db')],
    ['secretsmanager:DeleteSecret', secretArn ?? secretArnFor('orders/db')],
    ['secretsmanager:GetSecretValue', secretArnFor('billing/db')],
    ['ssm:PutParameter', paramArn('/orders/page-size')],
    ['ssm:DeleteParameter', paramArn('/orders/api-key')],
    ['ssm:GetParameter', paramArn('/billing/api-key')],
    ['s3:GetObject', 'arn:aws:s3:::any-bucket/any-key'],
    ['dynamodb:Scan', `arn:aws:dynamodb:us-east-1:${ACCOUNT}:table/orders`],
    ['iam:PassRole', `arn:aws:iam::${ACCOUNT}:role/${RoleName}`],
  ];
  const leaks = forbidden.filter(([a, r]) => allows(a, r)).map(([a, r]) => `${a} on ${r.split(':').slice(5).join(':') || r}`);
  expect(!leaks.length, `also allowed: ${leaks.join('; ')}`);
});

await check('loadConfig() reads the current values live from Secrets Manager and SSM', async () => {
  const { loadConfig } = await fromSandbox('./config.mjs');
  expect(typeof loadConfig === 'function', 'config.mjs does not export loadConfig');
  const password = nonce('pw') + nonce('');
  const pageSize = 10 + Math.floor(Math.random() * 90);
  const apiKey = nonce('key');
  await sm.send(new smSdk.PutSecretValueCommand({ SecretId: 'orders/db', SecretString: JSON.stringify({ username: 'orders_app', password }) }));
  await ssm.send(new ssmSdk.PutParameterCommand({ Name: '/orders/page-size', Value: String(pageSize), Type: 'String', Overwrite: true }));
  await ssm.send(new ssmSdk.PutParameterCommand({ Name: '/orders/api-key', Value: apiKey, Type: 'SecureString', Overwrite: true }));
  const got = await loadConfig();
  expectEqual(got, { dbUser: 'orders_app', dbPassword: password, pageSize, apiKey });
});

done();
