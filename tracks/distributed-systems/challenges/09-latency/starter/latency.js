// Tools for taming latency.

// The p-th percentile (0 < p <= 100) of a list of numbers, using the
// nearest-rank method: sort ascending, then take the value at rank ceil(p/100 * n).
// Don't modify the input array.
export function percentile(samples, p) {
  // TODO
  return 0;
}

// Run fn(signal) but give up after ms milliseconds:
//   - resolve/reject with fn's result if it settles in time
//   - otherwise reject with an Error whose code is 'ETIMEDOUT', AND abort the
//     signal so the slow work is cancelled rather than left running
export async function withTimeout(fn, ms) {
  // TODO
  return fn(new AbortController().signal);
}

// Hedged request: call fn(signal). If it hasn't settled after hedgeAfterMs,
// call fn again (a "hedge") and use whichever SUCCEEDS first. Abort the loser.
// Reject only if every attempt fails.
export async function hedged(fn, { hedgeAfterMs }) {
  // TODO
  return fn(new AbortController().signal);
}
