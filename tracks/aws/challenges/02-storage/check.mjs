import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { config, done, gradeAnswers, notFound, readAnswers, sdk } from '../../fixtures/validator.mjs';

watchdog(30000);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const { S3Client, HeadBucketCommand, GetObjectCommand, ListObjectsV2Command } = await sdk('s3');
const { EC2Client, DescribeVolumesCommand } = await sdk('ec2');
const s3 = new S3Client(config);
const ec2 = new EC2Client(config);
const Bucket = 'onboard-receipts';
const Key = 'receipts/2026/001.json';
// The validator's own copy, so editing the sandbox's receipt.json doesn't help.
const receipt = JSON.parse(readFileSync(path.join(HERE, 'starter/receipt.json'), 'utf8'));

await check(`bucket ${Bucket} exists`, async () => {
  try {
    await s3.send(new HeadBucketCommand({ Bucket }));
  } catch (e) {
    throw new Error(notFound(e) ? 'no such bucket — run node s3.mjs' : e.message);
  }
});

let object;
await check(`${Key} holds the receipt from receipt.json`, async () => {
  try {
    object = await s3.send(new GetObjectCommand({ Bucket, Key }));
  } catch (e) {
    throw new Error(notFound(e) ? 'object not found' : e.message);
  }
  const body = await object.Body.transformToString();
  let parsed;
  try { parsed = JSON.parse(body); } catch { throw new Error('the object is not JSON'); }
  expectEqual(parsed, receipt, 'content: ');
});

await check(`${Key} has ContentType application/json`, () => {
  expect(object, 'object not found');
  expect(/^application\/json\b/.test(object.ContentType ?? ''), `ContentType is "${object.ContentType}"`);
});

await check('at least 3 objects under the receipts/2026/ prefix', async () => {
  const { KeyCount = 0, Contents = [] } = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: 'receipts/2026/' }));
  const n = Math.max(KeyCount, Contents.length);
  expect(n >= 3, `found ${n}`);
});

let url;
await check('presigned-url.txt holds a presigned GET URL for receipts/2026/001.json', () => {
  let raw;
  try { raw = readFileSync(path.join(SANDBOX, 'presigned-url.txt'), 'utf8').trim(); } catch { throw new Error('presigned-url.txt is missing'); }
  try { url = new URL(raw); } catch { throw new Error('not a URL'); }
  expect(url.searchParams.get('X-Amz-Signature'), 'no X-Amz-Signature in the query string (use getSignedUrl)');
  expect(decodeURIComponent(url.pathname).endsWith(`/${Key}`), `the path doesn't point at ${Key}`);
});

await check('the presigned URL expires in 15 minutes (X-Amz-Expires=900)', () => {
  expect(url, 'no URL');
  const exp = Number(url.searchParams.get('X-Amz-Expires'));
  expect(exp === 900, `X-Amz-Expires is ${url.searchParams.get('X-Amz-Expires')}`);
});

await check('fetching the presigned URL (no credentials) returns the receipt', async () => {
  expect(url, 'no URL');
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  expect(res.ok, `HTTP ${res.status}`);
  expectEqual(JSON.parse(await res.text()), receipt);
});

let volumes = [];
await check('exactly one EBS volume tagged Name=onboard-data (ebs.mjs is re-runnable)', async () => {
  ({ Volumes: volumes = [] } = await ec2.send(new DescribeVolumesCommand({
    Filters: [{ Name: 'tag:Name', Values: ['onboard-data'] }],
  })));
  volumes = volumes.filter((v) => v.State !== 'deleting' && v.State !== 'deleted');
  expect(volumes.length === 1, `found ${volumes.length}`);
});

await check('the volume is 8 GiB, gp3, in us-east-1a', () => {
  const v = volumes[0];
  expect(v, 'no volume');
  expectEqual({ size: v.Size, type: v.VolumeType, az: v.AvailabilityZone }, { size: 8, type: 'gp3', az: 'us-east-1a' });
});

await check('storage.json: each scenario uses the right kind of storage', () =>
  gradeAnswers(readAnswers('storage.json'), {
    'postgres-on-one-server': 'EBS',
    'seven-years-of-backups': 'S3',
    'wordpress-shared-uploads': 'EFS',
    'static-site-files': 'S3',
    'dataset-for-a-gpu-fleet': 'EFS',
    'app-server-root-disk': 'EBS',
  }));

done();
