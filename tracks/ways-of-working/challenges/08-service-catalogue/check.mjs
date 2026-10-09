import { check, expect, fromSandbox } from '../../../../lib/checks.mjs';
import { read } from '../../wow-checks.mjs';

const { default: YAML } = await fromSandbox('yaml');
const src = read('catalog-info.yaml');
let doc = {};
const spec = () => doc?.spec ?? {};
const cat = () => spec().catalogue ?? {};
const text = (v) => JSON.stringify(v ?? '').toLowerCase();
const filled = (v) => (Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.values(v).some(filled) : String(v ?? '').trim() !== '');
const mentions = (v, ...needles) => {
  const t = text(v);
  const missing = needles.filter((n) => !(n instanceof RegExp ? n.test(t) : t.includes(n)));
  expect(!missing.length, `missing: ${missing.map((n) => (n instanceof RegExp ? n.source.replace(/\\b/g, '') : n)).join(', ')}`);
};

await check('catalog-info.yaml is valid YAML', () => { doc = YAML.parse(src); expect(doc && typeof doc === 'object', 'empty document'); });

await check('it is a Backstage Component: apiVersion, kind, metadata.name "beacon", a description', () => {
  expect(doc.apiVersion === 'backstage.io/v1alpha1' && doc.kind === 'Component', 'keep apiVersion/kind');
  expect(doc.metadata?.name === 'beacon', `metadata.name is "${doc.metadata?.name}"`);
  expect(String(doc.metadata?.description ?? '').trim().split(/\s+/).length >= 4, 'write a one-line description');
});

await check('lifecycle, owner (as an entity ref) and system are set', () => {
  expect(spec().lifecycle === 'production', `lifecycle is "${spec().lifecycle}". Is Beacon live?`);
  expect(spec().owner === 'group:team-beacon', `owner is "${spec().owner}". Use an entity ref: group:<team>`);
  expect(spec().system === 'notifications', `system is "${spec().system}"`);
});

await check('every catalogue section is filled in', () => {
  const sections = ['applications', 'awsServices', 'databases', 'apis', 'authentication', 'cicd', 'infrastructure',
    'externalSystems', 'monitoring', 'alerting', 'ownership'];
  const empty = sections.filter((k) => !filled(cat()[k]));
  expect(!empty.length, `empty: ${empty.join(', ')}`);
  expect(spec().dependsOn?.length, 'spec.dependsOn is empty');
});

await check('Applications: beacon-api and beacon-worker, each with type and runtime', () => {
  const apps = cat().applications ?? [];
  for (const n of ['beacon-api', 'beacon-worker']) {
    const a = apps.find((x) => x?.name === n);
    expect(a, `no application named ${n}`);
    expect(a.type && /node/i.test(String(a.runtime)), `${n} needs a type and its runtime (Node.js 20)`);
  }
});

await check('AWS services: ECS Fargate, SQS, RDS, Secrets Manager, ECR and CloudWatch, each with a purpose', () => {
  const svcs = cat().awsServices ?? [];
  mentions(svcs.map((s) => s?.service), /\becs\b|fargate/, 'sqs', 'rds', 'secrets manager', /\becr\b/, 'cloudwatch');
  expect(svcs.every((s) => String(s?.purpose ?? '').trim()), 'give every service a purpose');
});

await check('Databases: beacon-db, PostgreSQL, with its retention', () => {
  const db = (cat().databases ?? []).find((d) => d?.name === 'beacon-db');
  expect(db, 'no database named beacon-db');
  mentions(db, 'postgres', '90');
});

await check('APIs: provides the Beacon Messages API (REST, with its OpenAPI spec) and consumes TextBridge', () => {
  mentions(cat().apis?.provides, 'rest', 'openapi.yaml');
  mentions(cat().apis?.consumes, 'textbridge');
  expect((spec().providesApis ?? []).length, 'list the API in spec.providesApis too');
});

await check('Authentication: OAuth 2.0 client credentials via Okta in, an API key from Secrets Manager out', () => {
  mentions(cat().authentication?.inbound, 'oauth', 'okta');
  mentions(cat().authentication?.outbound, 'api key', 'beacon/textbridge-api-key');
});

await check('no secrets in the catalogue (the dev API key must not appear)', () =>
  expect(!src.includes('tb_test_'), 'remove the key. Record where the secret lives, never its value'));

await check('CI/CD and infrastructure: GitHub Actions to ECS, Terraform in platform-infra, eu-west-2', () => {
  mentions(cat().cicd, 'github actions', 'ecs');
  mentions(cat().infrastructure, 'terraform', 'platform-infra', 'eu-west-2');
});

await check('External systems: TextBridge and the legacy SMSPort', () => mentions(cat().externalSystems, 'textbridge', 'smsport'));

await check('Monitoring: Datadog (metrics + dashboard) and CloudWatch Logs', () => mentions(cat().monitoring, 'datadog', 'cloudwatch', 'beacon overview'));

await check('Alerting: PagerDuty to the team-beacon on-call, with all three alerts', () => {
  const a = cat().alerting ?? {};
  mentions([a.tool, a.routesTo], 'pagerduty', 'team-beacon');
  expect((a.alerts ?? []).length >= 3, `found ${(a.alerts ?? []).length} alerts`);
  mentions(a.alerts, /dlq|dead.?letter/, '2%', /5 min/);
});

await check('Ownership: team-beacon, Tom Okafor, Priya Shah, #team-beacon', () =>
  mentions(cat().ownership, 'team-beacon', 'tom okafor', 'priya shah', '#team-beacon'));

await check('Dependencies: spec.dependsOn uses entity refs and covers the queue, the database and customer-profile-api', () => {
  const deps = spec().dependsOn ?? [];
  const bad = deps.filter((d) => !/^(component|resource|api|system):[a-z0-9-]+$/.test(String(d)));
  expect(!bad.length, `not an entity ref: ${bad.join(', ')} (use kind:name, e.g. resource:beacon-db)`);
  for (const ref of ['resource:beacon-queue', 'resource:beacon-db', 'component:customer-profile-api']) {
    expect(deps.includes(ref), `missing ${ref}`);
  }
});
