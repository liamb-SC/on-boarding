# 02 · Circuit breaker

**Skills:** failing fast, the CLOSED / OPEN / HALF_OPEN state machine,
consecutive-failure thresholds, trial requests, injectable clocks for testing.

## Background
When a dependency is down, calling it anyway is the worst option. Every
request waits for a timeout, threads and connections pile up, and the
struggling service gets hammered just as it tries to recover. Failures
**cascade**.

A **circuit breaker** sits in front of the call:

```
          3 failures in a row                 resetTimeout passes
 CLOSED ───────────────────────▶ OPEN ───────────────────────▶ HALF_OPEN
   ▲                               ▲                               │
   │        trial succeeds         │       trial fails             │
   └───────────────────────────────┴───────────────────────────────┘
```

While OPEN it rejects instantly, so the caller can show a fallback (cached
data, "try again later") and the dependency gets breathing room. HALF_OPEN
lets a single request probe whether the dependency has recovered.
Libraries: `opossum` (Node), Resilience4j (Java), Polly (.NET). Service meshes
such as Envoy and Istio do it at the network level.

## Scenario
`flaky-service.js` is a dependency you can switch `up` or `down`.
`breaker.js` has the class skeleton, with the rules in its top comment.

## Goal
Implement `CircuitBreaker.call` in `breaker.js` so it follows the state
machine: pass through when CLOSED; trip after `failureThreshold`
**consecutive** failures; fail fast with `CircuitOpenError` while OPEN; after
`resetTimeoutMs`, allow exactly **one** trial call (HALF_OPEN), which closes or
re-opens the circuit. Keep `this.state` up to date.

`npm run demo` shows slow failures, then fast-fails, then recovery.

## Hints
- Track `this.failures` and `this.openedAt`.
- Check whether OPEN should become HALF_OPEN at the start of `call()`, by
  comparing `this.now() - this.openedAt` with `this.resetTimeoutMs`.
- For "one trial at a time", set a flag such as `this.trialInFlight` before
  awaiting the trial.

## Check your work
```
./onboard validate distributed-systems/02
```
