import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// ----- encryption at rest ------------------------------------------------------
// encrypt(plaintext, key) -> string, decrypt(string, key) -> plaintext.
// `key` is a 32-byte Buffer (AES-256).
//
// TODO 1: this is AES-CBC with a FIXED IV: the same plaintext always gives the
// same ciphertext, and nothing detects tampering. Switch to AES-256-GCM with a
// fresh random 12-byte IV per message, and return
//     <iv hex>:<auth tag hex>:<ciphertext hex>
// decrypt must throw if anything was modified (GCM's final() does that for you
// once you've called setAuthTag).
const FIXED_IV = Buffer.alloc(16, 0);

export function encrypt(plaintext, key) {
  const cipher = createCipheriv('aes-256-cbc', key, FIXED_IV);
  return Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]).toString('hex');
}

export function decrypt(payload, key) {
  const decipher = createDecipheriv('aes-256-cbc', key, FIXED_IV);
  return Buffer.concat([decipher.update(Buffer.from(payload, 'hex')), decipher.final()]).toString('utf8');
}

// ----- password storage --------------------------------------------------------
// TODO 2: MD5 is fast (GPUs try billions per second) and unsalted (equal
// passwords give equal hashes, so precomputed tables work). Use scrypt:
//   - a random 16-byte salt per password
//   - scryptSync(password, salt, 64)
//   - store it as  scrypt$<salt hex>$<hash hex>
export function hashPassword(password) {
  return createHash('md5').update(password).digest('hex');
}

// TODO 3: re-derive with the stored salt and compare using timingSafeEqual.
// Return false (don't throw) for a malformed stored value.
export function verifyPassword(password, stored) {
  return hashPassword(password) === stored;
}
