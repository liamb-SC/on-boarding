// validator.mjs — shared bits for the AWS track's check.mjs files. Validators
// query LocalStack directly (with the sandbox's copy of the AWS SDK) to see
// what really exists, rather than trusting the learner's files.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fromSandbox, SANDBOX } from '../../../lib/checks.mjs';

process.env.AWS_SDK_JS_NODE_VERSION_SUPPORT_WARNING_DISABLED ??= 'true';
export const ENDPOINT = process.env.AWS_ENDPOINT_URL ?? 'http://localhost:4566';
export const REGION = 'us-east-1';
export const config = {
  endpoint: ENDPOINT,
  region: REGION,
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  forcePathStyle: true,
};

// sdk('s3') -> the @aws-sdk/client-s3 module from the sandbox's node_modules
export async function sdk(name) {
  const mod = await fromSandbox(name.startsWith('@') ? name : `@aws-sdk/client-${name}`);
  return mod.default ?? mod;
}

// A short random token, so checks can't pass on stale or hard-coded data.
export const nonce = (prefix = 'chk') => `${prefix}-${randomBytes(4).toString('hex')}`;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Read a JSON file the learner filled in; throws a readable error.
export function readAnswers(file) {
  let raw;
  try {
    raw = readFileSync(path.join(SANDBOX, file), 'utf8');
  } catch {
    throw new Error(`${file} is missing`);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`${file} is not valid JSON: ${e.message}`);
  }
}

// Compare multiple-choice answers with the key, case-insensitively. Throws
// naming the wrong ones (not the right answers).
export function gradeAnswers(answers, key, label = '') {
  const norm = (v) => String(v ?? '').trim().toLowerCase();
  const blank = Object.keys(key).filter((k) => !norm(answers?.[k]));
  if (blank.length) throw new Error(`${label}still unanswered: ${blank.join(', ')}`);
  const wrong = Object.keys(key).filter((k) => {
    const want = Array.isArray(key[k]) ? key[k] : [key[k]];
    return !want.map(norm).includes(norm(answers[k]));
  });
  if (wrong.length) throw new Error(`${label}${wrong.length} not right yet: ${wrong.join(', ')}`);
}

// Is this a "not found" style SDK error?
export const notFound = (e) =>
  e?.$metadata?.httpStatusCode === 404 || /NotFound|NoSuch|NonExistent|DoesNotExist/i.test(e?.name ?? '');

// Exit once output is flushed, in case the learner's code left something
// (a timer, an open socket) holding the process open.
export const done = () => process.stdout.write('', () => process.exit(0));
