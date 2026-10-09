# 05 · Alert rules that page for the right things

**Skills:** Prometheus alerting rules, recording rules, thresholds, `for:`
durations, severity labels, annotations with templates, runbook links,
alerting on symptoms rather than causes.

## Background
- A good page is **urgent, real and actionable**. Alert on what users feel
  (errors and latency: the symptoms) rather than every cause (CPU at 80%).
- **`for:`** is how long the condition must stay true before the alert fires.
  Until then it's only *pending*. It filters out blips that fix themselves.
  Too short and you get woken for nothing. Too long and users suffer first.
- **Severity** routes the alert: `page` wakes someone up now, `ticket` can
  wait until working hours.
- **Annotations** are what the on-call person reads at 3am: a `summary` that
  says which service and how bad (`{{ $labels.service }}`, `{{ $value }}`),
  and a `runbook_url` that says what to do.
- **Recording rules** pre-compute expensive queries into a named series
  (`level:metric:operation`), so alert expressions stay short and fast.

```yaml
- alert: DiskAlmostFull
  expr: node:disk_free:ratio < 0.1
  for: 15m
  labels: { severity: ticket }
  annotations:
    summary: "{{ $labels.instance }} has under 10% disk left"
    runbook_url: https://runbooks.example.com/disk-almost-full
```

## Scenario
`alerts.yml` already records two series per service:
`service:http_error_ratio:rate5m` (the share of requests that are 5xx, from 0
to 1) and `service:http_request_duration_seconds:p99_5m` (p99 latency **in
seconds**). The team has agreed on two alerts.

## Goal
Add both alerts to the `shop-api-alerts` group, using the recorded series:
1. **`HighErrorRate`:** more than **5%** of requests failing for **5
   minutes**. Severity `page`.
2. **`HighLatencyP99`:** p99 above **500ms** for **10 minutes**. Severity `ticket`.

Each needs a `summary` that includes `{{ $labels.service }}` and an `https://`
`runbook_url` (an example URL is fine).

The validator replays 90 minutes of sample data through your rules. There's a
3-minute error blip, a long error incident, a short latency spike and a long
one. Your alerts must fire for the incidents only.

## Hints
- Keep each `expr` to `<recorded series> > <threshold>`. That's all the
  validator's mini-evaluator understands, and it's good practice anyway.
- Watch the units. The latency series is in seconds.
- With Docker you can lint with Prometheus's own tool:
  `docker run --rm -v "$PWD:/w" --entrypoint promtool prom/prometheus check rules /w/alerts.yml`

## Check your work
```
./onboard validate observability/05
```
