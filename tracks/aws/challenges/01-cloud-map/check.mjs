import { check, expect } from '../../../../lib/checks.mjs';
import { gradeAnswers, readAnswers } from '../../fixtures/validator.mjs';

const CATEGORY = {
  compute: ['EC2', 'Lambda', 'ECS'],
  storage: ['S3', 'EBS', 'EFS'],
  database: ['RDS', 'DynamoDB'],
  networking: ['VPC', 'Subnet', 'Security group', 'CloudFront'],
};
const SCENARIO = {
  'resize-on-upload': 'Lambda',
  'legacy-app-full-os': 'EC2',
  'run-our-containers': 'ECS',
  'user-uploads-at-scale': 'S3',
  'disk-for-one-server': 'EBS',
  'shared-folder-many-servers': 'EFS',
  'orders-with-joins': 'RDS',
  'session-lookups-by-key': 'DynamoDB',
  'our-private-network': 'VPC',
  'keep-db-off-internet': 'Subnet',
  'only-443-to-web-servers': 'Security group',
  'fast-assets-worldwide': 'CloudFront',
};

let map;
await check('map.json is valid JSON with "categories" and "scenarios"', () => {
  map = readAnswers('map.json');
  if (!map.categories || !map.scenarios) throw new Error('keep both top-level keys');
});

const services = Object.values(CATEGORY).flat();
const norm = (v) => String(v ?? '').trim().toLowerCase();

await check('every category is one of compute / storage / database / networking', () => {
  expect(Object.values(map?.categories ?? {}).some(norm), 'nothing filled in yet');
  const odd = Object.entries(map?.categories ?? {})
    .filter(([, v]) => norm(v) && !Object.keys(CATEGORY).includes(norm(v)));
  if (odd.length) throw new Error(`not a category: ${odd.map(([k, v]) => `${k}="${v}"`).join(', ')}`);
});

await check('categories: each service is in the right category', () => {
  const key = Object.fromEntries(Object.entries(CATEGORY).flatMap(([c, list]) => list.map((s) => [s, c])));
  gradeAnswers(map?.categories ?? {}, key);
});

await check('every scenario names a service from the list', () => {
  expect(Object.values(map?.scenarios ?? {}).some(norm), 'nothing filled in yet');
  const odd = Object.entries(map?.scenarios ?? {})
    .filter(([, v]) => norm(v) && !services.map(norm).includes(norm(v)));
  if (odd.length) throw new Error(`not in the list: ${odd.map(([k, v]) => `${k}="${v}"`).join(', ')}`);
});

await check('scenarios: each one picks the best-fit service', () => gradeAnswers(map?.scenarios ?? {}, SCENARIO));
