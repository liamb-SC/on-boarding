// Fire lots of operations at the bank at once and see what survives.
import { Bank } from './bank.js';
import { createDb } from './db.js';

const bank = new Bank(createDb());
await Promise.all(Array.from({ length: 100 }, () => bank.deposit('alice', 1)));
console.log('100 deposits of 1 -> balance', await bank.balance('alice'), '(expected 100)');

const bank2 = new Bank(createDb({ bob: 50 }));
const results = await Promise.allSettled(Array.from({ length: 10 }, () => bank2.withdraw('bob', 10)));
const ok = results.filter((r) => r.status === 'fulfilled').length;
console.log(`10 withdrawals of 10 from 50 -> ${ok} succeeded, balance`, await bank2.balance('bob'), '(expected 5 and 0)');
