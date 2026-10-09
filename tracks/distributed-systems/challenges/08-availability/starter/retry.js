// Retry a flaky async operation with exponential backoff and FULL jitter.
//
//   await retry(() => callPaymentApi(), { retries: 3, baseMs: 100, capMs: 2000 })
//
// - Call fn(). If it resolves, return its value.
// - If it throws and isRetryable(err) is true and retries are left, wait and try again.
//   Retry number n (0, 1, 2, ...) waits random() * min(capMs, baseMs * 2 ** n).
// - Otherwise rethrow the last error.
//
// sleep and random are injectable so tests don't have to wait or guess.
const realSleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function retry(fn, {
  retries = 3,
  baseMs = 100,
  capMs = 2000,
  isRetryable = () => true,
  sleep = realSleep,
  random = Math.random,
} = {}) {
  // TODO
  return fn();
}
