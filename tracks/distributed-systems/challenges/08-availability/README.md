# 08 · Availability: nines, retries and idempotency

**Skills:** availability maths (serial vs redundant), downtime budgets,
retries with exponential backoff and jitter, retryable vs non-retryable
errors, idempotency keys.

## Background
**The nines.** 99.9% ("three nines") allows 0.1% downtime. Dependencies
called **in series** multiply: if checkout needs three services at 99.9% each,
it can only be 0.999³ available. **Redundant** copies (either one will do)
fail together only when all are down: 1 − (1 − a)ⁿ.

**Retries** turn transient failures into successes, but naive retries are
dangerous:
- Back off **exponentially** (100, 200, 400 ms…) and **cap** the delay.
- Add **jitter**. Without it, every client that failed at the same moment
  retries at the same moment (a *retry storm*). With "full jitter" the wait is
  `random() × backoff`.
- Only retry what can succeed next time: 503s and timeouts, not a 400.

**Idempotency.** If a charge succeeds but the response is lost, the client
retries, and without protection it charges the card twice. The client sends an
**Idempotency-Key**. The server stores the result per key and returns it again
for a repeat. This is how Stripe's API works. Retries and idempotency keys
belong together.

## Scenario
`nines.json` holds four questions. `retry.js` and `payments.js` are skeletons
with their rules in the comments.

## Goal
1. Fill in `nines.json` (work it out yourself, or use `node -e`).
2. Implement `retry` in `retry.js`: backoff, cap, full jitter, `isRetryable`.
3. Implement `createPaymentHandler` in `payments.js`, following the rules in the
   file, including concurrent duplicates.

`npm run demo` runs both.

## Hints
- A year has 8,760 hours. A 30-day month has 43,200 minutes.
- Retry number `n` waits `random() * Math.min(capMs, baseMs * 2 ** n)`.
- For idempotency, store the **promise** in a `Map` keyed by idempotency key,
  together with the amount. Concurrent duplicates then await the same promise.
  If it rejects, delete the entry.
- `const err = new Error('...'); err.code = 'KEY_REUSED'; throw err;`

## Check your work
```
./onboard validate distributed-systems/08
```
