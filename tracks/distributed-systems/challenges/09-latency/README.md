# 09 · Latency: percentiles, timeouts and hedging

**Skills:** p50/p95/p99 vs the mean, tail latency, fan-out amplification,
timeouts with cancellation (`AbortSignal`), deadline budgets, hedged requests.

## Background
- **Percentiles, not averages.** "Mean 25 ms" can hide 1 request in 20
  taking 400 ms. p50 is the typical user. **p99** is what 1 in 100 requests,
  and so most of your heaviest users, actually get. SLOs are written on
  percentiles.
- **Tail latency is amplified by fan-out.** If a page calls 10 backends in
  parallel, it's as slow as the slowest one. A 1%-slow backend becomes a
  much bigger slice of slow pages.
- **Timeouts** stop one slow dependency from holding a request (and its
  memory, sockets and threads) forever. Cancel the work too, not just your
  wait for it. Pass a **deadline budget** downstream: each hop gets whatever
  time is left.
- **Hedged requests** (from Google's *The Tail at Scale*): if a call is slower
  than, say, its p95, send a second copy to another replica and take whichever
  answers first. For a few percent more load, the tail collapses.

## Scenario
`backend.js` is a fake service whose latencies you script, and it honours
`AbortSignal`. `latency.js` holds three empty tools.

## Goal
1. `percentile(samples, p)` using nearest rank.
2. `withTimeout(fn, ms)`: rejects with `code: 'ETIMEDOUT'` and **aborts** `fn`'s signal.
3. `hedged(fn, { hedgeAfterMs })`: hedges a slow call, the first success wins,
   and the loser is aborted.
4. `answers.json`: two numbers.

`npm run demo` compares p50/p95/p99 with and without hedging.

## Hints
- Nearest rank: `sorted[Math.ceil((p / 100) * n) - 1]`. Sort a copy with
  `[...xs].sort((a, b) => a - b)`. The default sort is alphabetical!
- `const ac = new AbortController(); fn(ac.signal); ... ac.abort();`. Clear the
  timer once `fn` settles.
- For `hedged`, give each attempt its own `AbortController`. `Promise.any`
  resolves with the first success and only rejects if all of them fail.
- Fan-out: P(at least one of 10 is slow) = 1 − 0.99¹⁰.

## Check your work
```
./onboard validate distributed-systems/09
```
