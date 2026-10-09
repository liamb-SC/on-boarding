// Static checks on k8s/*.yaml: the same mistakes kubectl apply wouldn't catch
// (a selector that matches nothing, a Service pointing at the wrong port).
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX } from '../../../../lib/checks.mjs';

const { parseAllDocuments } = await fromSandbox('yaml');
const dir = path.join(SANDBOX, 'k8s');
let objects = [];
await check('k8s/*.yaml parse as YAML', () => {
  for (const f of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
    for (const d of parseAllDocuments(readFileSync(path.join(dir, f), 'utf8'))) {
      if (d.errors.length) throw new Error(`${f}: ${d.errors[0].message}`);
      const obj = d.toJS();
      if (obj) objects.push(obj);
    }
  }
});

const find = (kind) => objects.find((o) => o.kind === kind && o.metadata?.name === 'echo');
const deploy = find('Deployment') ?? {};
const svc = find('Service') ?? {};
const podLabels = deploy.spec?.template?.metadata?.labels ?? {};
const container = deploy.spec?.template?.spec?.containers?.[0] ?? {};
const subset = (small, big) => Object.keys(small ?? {}).length > 0 &&
  Object.entries(small).every(([k, v]) => big[k] === v);

await check('a Deployment named echo (apiVersion apps/v1)', () =>
  expect(deploy.apiVersion === 'apps/v1', 'no `kind: Deployment` with `metadata.name: echo` and `apiVersion: apps/v1`'));
await check('it runs 2 replicas', () => expectEqual(deploy.spec?.replicas, 2, 'replicas: '));
await check('its selector matches the pod template labels', () =>
  expect(subset(deploy.spec?.selector?.matchLabels, podLabels),
    `selector ${JSON.stringify(deploy.spec?.selector?.matchLabels)} vs pod labels ${JSON.stringify(podLabels)}`));
await check('the image is hashicorp/http-echo with a pinned version tag (not :latest)', () =>
  expect(/^hashicorp\/http-echo:(?!latest$)[\w.-]+$/.test(container.image ?? ''), `image is ${container.image}`));
await check('the container is started with args ["-text=hello from kubernetes"]', () =>
  expect((container.args ?? []).includes('-text=hello from kubernetes'), `args are ${JSON.stringify(container.args)}`));
await check('it declares containerPort 5678', () =>
  expect((container.ports ?? []).some((p) => p.containerPort === 5678), 'add ports: [{ containerPort: 5678 }]'));
await check('it has a readinessProbe', () => expect(container.readinessProbe, 'add readinessProbe (httpGet on / port 5678)'));
await check('it sets resource requests and limits (cpu + memory)', () => {
  const r = container.resources ?? {};
  expect(r.requests?.cpu && r.requests?.memory && r.limits?.memory, 'need requests.cpu, requests.memory and limits.memory');
});
await check('a Service named echo (apiVersion v1, type ClusterIP)', () => {
  expect(svc.apiVersion === 'v1', 'no `kind: Service` with `metadata.name: echo` and `apiVersion: v1`');
  expect((svc.spec?.type ?? 'ClusterIP') === 'ClusterIP', `type is ${svc.spec?.type}`);
});
await check("the Service's selector matches the Deployment's pods", () =>
  expect(subset(svc.spec?.selector, podLabels), `selector ${JSON.stringify(svc.spec?.selector)} vs pod labels ${JSON.stringify(podLabels)}`));
await check('the Service listens on port 80 and forwards to the container port', () => {
  const p = svc.spec?.ports?.[0] ?? {};
  expectEqual(p.port, 80, 'port: ');
  const named = (container.ports ?? []).find((cp) => cp.name && cp.name === p.targetPort);
  expect(p.targetPort === 5678 || named?.containerPort === 5678, `targetPort is ${JSON.stringify(p.targetPort)}, the container listens on 5678`);
});
