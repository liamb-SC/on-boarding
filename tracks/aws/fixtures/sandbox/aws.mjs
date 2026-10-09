// aws.mjs — shared settings for talking to LocalStack with the AWS SDK v3.
//
//   import { S3Client } from '@aws-sdk/client-s3';
//   import { config } from './aws.mjs';
//   const s3 = new S3Client(config);
//
// Every client takes the same `config`: it points the SDK at LocalStack instead
// of real AWS. On real AWS you'd drop `endpoint` and the fake credentials, and
// the SDK would find your real ones (env vars, ~/.aws, an IAM role...).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';

// The SDK is pinned to a release that supports Node 20; skip its upgrade nag.
process.env.AWS_SDK_JS_NODE_VERSION_SUPPORT_WARNING_DISABLED ??= 'true';

export const ENDPOINT = process.env.AWS_ENDPOINT_URL ?? 'http://localhost:4566';
export const REGION = 'us-east-1';
// LocalStack's default account. ARNs look like arn:aws:sqs:us-east-1:000000000000:my-queue
export const ACCOUNT_ID = '000000000000';

export const config = {
  endpoint: ENDPOINT,
  region: REGION,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  forcePathStyle: true, // S3 only: http://localhost:4566/<bucket>/<key> instead of <bucket>.localhost
};

// arn('sqs', 'my-queue') -> arn:aws:sqs:us-east-1:000000000000:my-queue
export const arn = (service, resource, region = REGION) =>
  `arn:aws:${service}:${region}:${ACCOUNT_ID}:${resource}`;

// A Lambda function needs an execution role. Returns the ARN of a basic one,
// creating it the first time. (Challenge 07 is about writing roles properly.)
export async function lambdaRoleArn(roleName = 'onboard-lambda-basic') {
  const { IAMClient, GetRoleCommand, CreateRoleCommand } = await import('@aws-sdk/client-iam');
  const iam = new IAMClient(config);
  try {
    return (await iam.send(new GetRoleCommand({ RoleName: roleName }))).Role.Arn;
  } catch (e) {
    if (e.name !== 'NoSuchEntity' && e.name !== 'NoSuchEntityException') throw e;
  }
  const trust = {
    Version: '2012-10-17',
    Statement: [{ Effect: 'Allow', Principal: { Service: 'lambda.amazonaws.com' }, Action: 'sts:AssumeRole' }],
  };
  const out = await iam.send(new CreateRoleCommand({ RoleName: roleName, AssumeRolePolicyDocument: JSON.stringify(trust) }));
  return out.Role.Arn;
}

// zipDir('function') -> a Buffer holding a .zip of every file in that folder,
// ready for Lambda's `Code: { ZipFile }`. (No `zip` binary needed.)
export function zipDir(dir) {
  const files = {};
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = path.join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else files[path.relative(dir, full).split(path.sep).join('/')] = readFileSync(full);
    }
  };
  walk(dir);
  return zipFiles(files);
}

// zipFiles({ 'index.mjs': 'export const handler = ...' }) -> Buffer (a .zip)
export function zipFiles(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const data = Buffer.isBuffer(content) ? content : Buffer.from(String(content));
    const packed = deflateRawSync(data);
    const nameBuf = Buffer.from(name);
    const crc = crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // local file header
    local.writeUInt16LE(20, 4);          // version needed
    local.writeUInt16LE(0x0800, 6);      // flags: UTF-8 names
    local.writeUInt16LE(8, 8);           // deflate
    local.writeUInt32LE(0x00210000, 10); // mod time/date: 1980-01-01
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    locals.push(local, nameBuf, packed);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // central directory header
    central.writeUInt16LE(0x031e, 4);     // made by: unix
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(0x00210000, 12);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38); // -rw-r--r--
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBuf);

    offset += local.length + nameBuf.length + packed.length;
  }
  const dir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // end of central directory
  end.writeUInt16LE(centrals.length / 2, 8);
  end.writeUInt16LE(centrals.length / 2, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dir, end]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
