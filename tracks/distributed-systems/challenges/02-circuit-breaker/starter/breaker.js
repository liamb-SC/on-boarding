// A circuit breaker wraps calls to a dependency and stops calling it while it's broken.
//
//   CLOSED     normal: calls go through. Count consecutive failures; at
//              failureThreshold, trip to OPEN. A success resets the count.
//   OPEN       fail fast: reject with CircuitOpenError WITHOUT calling the
//              dependency. After resetTimeoutMs, the next call moves to HALF_OPEN.
//   HALF_OPEN  let ONE trial call through (reject any others meanwhile).
//              Success -> CLOSED. Failure -> OPEN again (with a fresh timeout).
//
// Use this.now() for time, never Date.now(), so tests can control the clock.

export class CircuitOpenError extends Error {
  constructor() {
    super('circuit is open');
    this.code = 'CIRCUIT_OPEN';
  }
}

export class CircuitBreaker {
  constructor(fn, { failureThreshold = 3, resetTimeoutMs = 5000, now = Date.now } = {}) {
    this.fn = fn;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.now = now;
    this.state = 'CLOSED';
  }

  async call(...args) {
    // TODO
    return this.fn(...args);
  }
}
