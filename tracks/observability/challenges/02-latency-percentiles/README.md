# 02 · Latency percentiles: p50, p95, p99

**Skills:** percentiles (nearest-rank), why averages lie about latency, tail
latency, fan-out, reading a latency table.

## Background
- The **pN** latency is the time under which N% of requests finish. p50 (the
  median) is the typical request. p99 is the slowest 1%: one request in a
  hundred, which for a busy service is thousands of users a day.
- **Averages lie.** A mean blends a fast majority with a slow minority into a
  number that describes neither. Ten requests at 50ms and one at 3s average
  out at a harmless-looking 318ms.
- **Fan-out amplifies tails.** A page that makes many backend calls is as
  slow as its slowest call, so a "rare" p99 becomes common for users.
- Use **nearest-rank** here: sort ascending and take the value at 1-based rank
  `ceil(p/100 × n)`. Monitoring systems estimate percentiles in different ways,
  but the idea is the same.

## Scenario
`latency.log` is an access log from `shop-api`:
```
2026-10-01T12:00:00.164Z GET /api/products 200 21ms
```
Product owners say checkout is "fast on average". Is it?

## Goal
1. In `percentiles.js`, implement `parseLine(line)` and `percentile(values, p)`
   (the comments there say exactly what they return).
2. Run `npm run report` for a per-endpoint table.
3. Fill in `answers.json`:
   - `checkout`: the `mean`, `p50`, `p95` and `p99` of `POST /api/checkout`
   - `worst_mean` and `worst_p99`: the endpoints (as shown in the report, e.g.
     `"GET /api/products"`) with the highest mean and the highest p99
   - `q_averages`: checkout's mean is lower than search's. Why is that misleading?
     a) the log is sampled, so means are unreliable
     b) most checkouts are fast, which keeps the mean low, while ~3% take 2–3 seconds; the mean hides that tail
     c) the median would be the better single number, because it includes the slow requests
   - `q_fanout`: a page makes 10 independent calls with the same latency
     distribution. Roughly what share of page loads include at least one call
     slower than that p99? a) 1% b) about 10% c) about 50%

## Hints
- `[...values].sort((a, b) => a - b)`: copy first so you don't mutate the
  input, and always pass a comparator. The default sort compares as strings,
  so `1000` sorts before `9`.
- Look at checkout's p95 *and* its p99. Which one would you put on a dashboard?

## Check your work
```
./onboard validate observability/02
```
