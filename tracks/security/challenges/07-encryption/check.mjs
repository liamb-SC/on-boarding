import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const { encrypt, decrypt, hashPassword, verifyPassword } = await fromSandbox('./crypto.js');
const key = randomBytes(32);
const msg = 'card ending 4242 · £12.50 ✓';
const throws = (fn, what) => {
  let out;
  try { out = fn(); } catch { return; }
  throw new Error(`${what} decrypted without an error (got ${JSON.stringify(out)})`);
};
const parts = (s) => String(s).split(':');
const flip = (hex, i = 0) => {
  const b = Buffer.from(hex, 'hex');
  b[i] ^= 0x01;
  return b.toString('hex');
};

// ----- AES-256-GCM -----------------------------------------------------------------
let token;
await check('encrypt/decrypt round-trips (including non-ASCII)', () => {
  token = encrypt(msg, key);
  expect(decrypt(token, key) === msg, 'decrypt(encrypt(x)) !== x');
});
await check('output is <iv hex>:<tag hex>:<ciphertext hex> with a 12-byte IV and 16-byte tag', () => {
  const [iv, tag, ct, ...rest] = parts(token);
  expect(!rest.length && /^[0-9a-f]+$/i.test(iv + tag + ct), `got ${token}`);
  expect(iv.length === 24, `IV is ${iv.length / 2} bytes`);
  expect(tag.length === 32, `auth tag is ${tag.length / 2} bytes`);
});
await check('it really is AES-256-GCM (the validator can decrypt it independently)', () => {
  const [iv, tag, ct] = parts(token);
  const d = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
  d.setAuthTag(Buffer.from(tag, 'hex'));
  expect(Buffer.concat([d.update(Buffer.from(ct, 'hex')), d.final()]).toString('utf8') === msg, 'wrong plaintext');
});
await check('decrypt reads ciphertext produced by another AES-256-GCM implementation', () => {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update('interop', 'utf8'), c.final()]);
  expect(decrypt(`${iv.toString('hex')}:${c.getAuthTag().toString('hex')}:${ct.toString('hex')}`, key) === 'interop', 'wrong plaintext');
});
await check('encrypting the same plaintext twice gives different output (random IV)', () =>
  expect(encrypt(msg, key) !== encrypt(msg, key), 'identical ciphertexts leak which records are equal'));
await check('a modified ciphertext is rejected (decrypt throws)', () => {
  const [iv, tag, ct] = parts(token);
  throws(() => decrypt(`${iv}:${tag}:${flip(ct)}`, key), 'a tampered ciphertext');
});
await check('a modified IV or auth tag is rejected', () => {
  const [iv, tag, ct] = parts(token);
  throws(() => decrypt(`${flip(iv)}:${tag}:${ct}`, key), 'a tampered IV');
  throws(() => decrypt(`${iv}:${flip(tag, 15)}:${ct}`, key), 'a tampered tag');
});
await check('the wrong key is rejected', () => throws(() => decrypt(token, randomBytes(32)), 'the wrong key'));

// ----- scrypt ---------------------------------------------------------------------------
let stored;
await check('hashPassword returns scrypt$<16-byte salt hex>$<64-byte hash hex>', () => {
  stored = hashPassword('correct horse battery staple');
  expect(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/i.test(stored ?? ''), `got ${stored}`);
});
await check('the hash is scryptSync(password, salt, 64)', () => {
  const [, salt, hash] = String(stored).split('$');
  const want = [Buffer.from(salt, 'hex'), salt].map((s) => scryptSync('correct horse battery staple', s, 64).toString('hex'));
  expect(want.includes(hash.toLowerCase()), 'recomputing scrypt with your salt gives a different hash');
});
await check('the same password hashes differently each time (random salt)', () =>
  expect(hashPassword('hunter2') !== hashPassword('hunter2'), 'same hash twice: the salt isn\'t random'));
await check('verifyPassword: right password true, wrong password false', () => {
  expect(verifyPassword('correct horse battery staple', stored) === true, 'right password was rejected');
  expect(verifyPassword('Tr0ub4dor&3', stored) === false, 'wrong password was accepted');
});
await check('verifyPassword works on a hash made elsewhere', () => {
  const salt = randomBytes(16);
  const s = `scrypt$${salt.toString('hex')}$${scryptSync('s3cret!', salt, 64).toString('hex')}`;
  expect(verifyPassword('s3cret!', s) === true, 'rejected a valid scrypt$salt$hash');
});
await check('verifyPassword returns false (doesn\'t throw) for malformed stored values', () => {
  for (const bad of ['', 'scrypt$zz$00', createHash('md5').update('x').digest('hex')]) {
    let r;
    try { r = verifyPassword('x', bad); } catch (e) { throw new Error(`threw on ${JSON.stringify(bad)}: ${e.message}`); }
    expect(r === false, `returned ${r} for ${JSON.stringify(bad)}`);
  }
});
await check('verifyPassword compares with timingSafeEqual', () => {
  const src = readFileSync(path.join(SANDBOX, 'crypto.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  expect(/timingSafeEqual\s*\(/.test(src), 'use crypto.timingSafeEqual, not ===');
  expect(!/createHash\(\s*['"]md5/.test(src), 'md5 is still used');
});

// ----- quiz -------------------------------------------------------------------------------------
const KEY = {
  q1: '3efbd21f2e5ab283', q2: '5eb2bdd4e7f34c78', q3: 'aadaed22d0f25d86',
  q4: 'c98f75c0f6912f47', q5: '9e755bd32469c9b7', q6: '242f21b007b43e73',
};
let answers = {};
await check('answers.json is valid JSON', () => { answers = JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8')); });
for (const q of Object.keys(KEY)) {
  await check(`QUIZ ${q}`, () => {
    const a = String(answers[q] ?? '').trim().toLowerCase();
    expect(a, 'not answered');
    const h = createHash('sha256').update(`security/07:${q}:${a}`).digest('hex').slice(0, 16);
    expect(h === KEY[q], `"${a}" isn't it. Re-read the question`);
  });
}
