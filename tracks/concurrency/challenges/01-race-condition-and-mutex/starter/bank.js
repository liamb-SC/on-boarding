import { Mutex } from './mutex.js';

export class Bank {
  constructor(db) {
    this.db = db;
  }

  async deposit(account, amount) {
    const balance = await this.db.get(account);
    await this.db.set(account, balance + amount);
  }

  // Rejects with Error('insufficient funds') instead of going negative.
  async withdraw(account, amount) {
    const balance = await this.db.get(account);
    if (balance < amount) throw new Error('insufficient funds');
    await this.db.set(account, balance - amount);
  }

  balance(account) {
    return this.db.get(account);
  }
}
