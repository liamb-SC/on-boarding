// A FIFO async mutex (the one from challenge 01). Nothing to change here.
export class Mutex {
  #locked = false;
  #waiters = [];
  async acquire() {
    if (this.#locked) await new Promise((resolve) => this.#waiters.push(resolve));
    this.#locked = true;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.#waiters.shift();
      if (next) next(); else this.#locked = false;
    };
  }
  async runExclusive(fn) {
    const release = await this.acquire();
    try { return await fn(); } finally { release(); }
  }
}
