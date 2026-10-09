# 07 · Encryption at rest, password hashing and TLS basics

**Skills:** `node:crypto`, AES-256-GCM (IVs, auth tags), why ECB/CBC with a
fixed IV is broken, scrypt password hashing with salts, `timingSafeEqual`,
TLS concepts.

## Background
**Encryption** is reversible with a key. Use it for data you need to read
back (card tokens, API credentials, personal data at rest).
**Hashing** is one-way. Use it for passwords, which you only ever *check*.

- **AES-256-GCM** is the default choice for symmetric encryption. It's
  *authenticated*: besides the ciphertext you get a 16-byte **auth tag**, and
  decryption fails if a single bit of ciphertext, IV or tag was changed.
  CBC on its own gives you no such check.
- The **IV** (nonce) must be **unique per message** under the same key, and
  for GCM, 12 random bytes. It isn't secret, so store it next to the
  ciphertext. A fixed IV makes equal plaintexts encrypt equally. With GCM,
  reusing one is catastrophic.
- **Passwords:** fast hashes (MD5, SHA-256) let an attacker try billions of
  guesses per second on a stolen database. Use a deliberately slow,
  **salted** KDF: scrypt (in `node:crypto`), bcrypt or argon2. A random
  per-user **salt** makes equal passwords hash differently and kills
  precomputed tables.
- Compare secrets with **`timingSafeEqual`**. `===` returns as soon as a byte
  differs, which leaks timing.
- **TLS** protects data *in transit*. `QUIZ.md` covers what it does and doesn't do.

## Scenario
`crypto.js` "encrypts" with AES-CBC and an all-zero IV, and stores passwords
as unsalted MD5. Run `npm run demo` to see the problem.

## Goal
1. `encrypt`/`decrypt`: AES-256-GCM, a fresh random 12-byte IV per call,
   output `<iv hex>:<tag hex>:<ciphertext hex>`. `decrypt` must throw on any
   tampering or the wrong key.
2. `hashPassword`: `scrypt$<salt hex>$<hash hex>` with a random 16-byte salt and
   `scryptSync(password, salt, 64)`.
3. `verifyPassword`: re-derive with the stored salt, compare with
   `timingSafeEqual`, and return `false` for malformed input.
4. Answer the six questions in `QUIZ.md` in `answers.json`.

## Hints
- `createCipheriv('aes-256-gcm', key, iv)`, then `update` + `final`, then
  `cipher.getAuthTag()`. On the way back: `createDecipheriv`, `setAuthTag(tag)`
  *before* `final()`.
- `Buffer.from(hex, 'hex')` / `buf.toString('hex')`.
- `timingSafeEqual` throws if the lengths differ. Validate the stored format
  first.
- In production the key comes from a KMS or secret manager, and you'd add a
  version prefix (`v1:...`) so you can rotate keys later.

## Check your work
```
./onboard validate security/07
```
