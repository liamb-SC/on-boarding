import { readConfig, TimeoutError } from './services.js';

// 1. A promise-based readConfig. Resolves to the config, or rejects with the
//    error readConfig passes to its callback.
export function readConfigAsync(name) {
  return new Promise((resolve) => {
    readConfig(name, (err, config) => resolve(config));
  });
}

// 2. Call fn() and, if it rejects, try again, up to `attempts` calls in
//    total, waiting `delayMs` between calls. Resolves with the first success,
//    or rejects with the LAST error once the attempts run out.
export function retry(fn, attempts, delayMs = 0) {
  return fn().catch((err) => {
    if (attempts <= 1) throw err;
    setTimeout(() => retry(fn, attempts - 1, delayMs), delayMs);
  });
}

// 3. Settle the same way as `promise`, but reject with a TimeoutError if it
//    takes longer than `ms`. Once it has settled, no timer may be left running.
export function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new TimeoutError(`timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]);
}

// 4. Download `file` from whichever mirror SUCCEEDS first. Reject (with an
//    AggregateError) only if every mirror fails.
export function firstAvailable(mirrors, file) {
  return Promise.race(mirrors.map((download) => download(file)));
}
