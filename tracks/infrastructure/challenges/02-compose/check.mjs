// Static checks on compose.yaml. They read the file the way Compose does
// (short and long syntax both accepted), so no Docker is needed.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, fromSandbox, SANDBOX } from '../../../../lib/checks.mjs';

const { parse } = await fromSandbox('yaml');
let doc = {};
await check('compose.yaml is valid YAML', () => {
  doc = parse(readFileSync(path.join(SANDBOX, 'compose.yaml'), 'utf8')) ?? {};
});
const api = doc.services?.api ?? {};
const redis = doc.services?.redis ?? {};

// environment: [ "K=V" ] or { K: V }
const env = (svc) => Array.isArray(svc.environment)
  ? Object.fromEntries(svc.environment.map((e) => String(e).split(/=(.*)/s).slice(0, 2)))
  : (svc.environment ?? {});
// ports: [ "8080:3000" ] or [{ published: 8080, target: 3000 }]
const ports = (svc) => (svc.ports ?? []).map((p) => typeof p === 'object'
  ? `${p.published}:${p.target}`
  : String(p).replace(/^(127\.0\.0\.1|0\.0\.0\.0):/, '').replace(/\/tcp$/, ''));

await check('services `api` and `redis` are defined', () =>
  expect(doc.services?.api !== undefined && doc.services?.redis !== undefined, 'need services.api and services.redis'));
await check('api is built from this directory (build: .)', () =>
  expect(['.', './'].includes(typeof api.build === 'object' ? api.build.context : api.build), `build is ${JSON.stringify(api.build)}`));
await check('api publishes container port 3000 on host port 8080', () =>
  expect(ports(api).includes('8080:3000'), `ports are ${JSON.stringify(api.ports ?? [])}`));
await check('api gets REDIS_HOST=redis (the service name is its hostname)', () =>
  expect(env(api).REDIS_HOST === 'redis', `REDIS_HOST is ${JSON.stringify(env(api).REDIS_HOST)}`));
await check('api waits for redis to be healthy (depends_on ... condition: service_healthy)', () =>
  expect(api.depends_on?.redis?.condition === 'service_healthy',
    'use the long form: depends_on: { redis: { condition: service_healthy } }'));
await check('redis has a healthcheck that runs `redis-cli ping`', () => {
  const t = redis.healthcheck?.test;
  expect(t && [].concat(t).join(' ').includes('redis-cli ping'), `healthcheck.test is ${JSON.stringify(t)}`);
});
await check('redis keeps /data in a named volume, declared under top-level `volumes:`', () => {
  const mounts = (redis.volumes ?? []).map((v) => typeof v === 'object' ? [v.source, v.target] : String(v).split(':'));
  const named = mounts.find(([src, dst]) => dst === '/data' && src && !/^[./~]/.test(src));
  expect(named, 'mount something like `redis-data:/data`');
  expect(doc.volumes && named[0] in doc.volumes, `declare \`${named[0]}:\` under top-level volumes`);
});
