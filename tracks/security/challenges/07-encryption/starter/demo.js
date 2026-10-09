import { randomBytes } from 'node:crypto';
import { decrypt, encrypt, hashPassword, verifyPassword } from './crypto.js';

const key = randomBytes(32); // in real life: from a KMS / secret manager, never hard-coded
const a = encrypt('card ending 4242', key);
const b = encrypt('card ending 4242', key);
console.log('encrypted twice:', a, b, a === b ? '<- identical: an attacker can spot repeats!' : '');
console.log('decrypted:', decrypt(a, key));

const stored = hashPassword('correct horse battery staple');
console.log('stored hash:', stored);
console.log('right password:', verifyPassword('correct horse battery staple', stored));
console.log('wrong password:', verifyPassword('Tr0ub4dor&3', stored));
