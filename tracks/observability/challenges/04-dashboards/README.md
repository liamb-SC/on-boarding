# 04 · A RED dashboard, as code

**Skills:** the RED method (Rate, Errors, Duration), Grafana's dashboard JSON
model, PromQL `rate()`, error ratios, `histogram_quantile`, template
variables, units and thresholds, dashboards in version control.

## Background
- **RED** is the default dashboard for any request-serving service:
  - **Rate:** requests per second
  - **Errors:** the *share* of requests failing. A raw count grows with traffic, a ratio doesn't.
  - **Duration:** latency percentiles (p50 and p99), not the average
- Prometheus **counters** only go up, so you graph `rate(counter[5m])`
  (per-second increase), never the raw value. Sum it across pods with `sum(...)`.
- Latency is a **histogram**: `_bucket{le="0.25"}` counts requests that took
  ≤ 0.25s. `histogram_quantile(0.99, sum by (le) (rate(..._bucket[5m])))`
  estimates the p99. The `sum by (le)` merges every pod's buckets first.
- **Dashboards as code:** a Grafana dashboard is JSON. Keep it in git and
  review it like code, and it survives someone "tidying up" the UI.

The service exports these metrics (labels in braces):
```
http_requests_total{service, route, status}                       counter
http_request_duration_seconds_bucket{service, route, le}          histogram
```

## Scenario
`dashboard.json` is an empty Grafana dashboard for `shop-api`.
`example-panel.json` and `example-variable.json` show the shape of a panel and
a template variable, for a different metric.

## Goal
Fill in `dashboard.json`:
1. A real `title`, the tag `"red"`, and `refresh` every `"30s"`.
2. A template variable `service` (values from
   `label_values(http_requests_total, service)`). Every query filters on
   `service="$service"`.
3. Three panels, laid out side by side without overlapping (the grid is 24 columns wide):
   - **Rate:** total requests/sec. Unit `reqps`.
   - **Errors:** 5xx requests / all requests (`status=~"5.."`). Unit
     `percentunit`, with a red threshold step at `0.05`.
   - **Duration:** two queries, p50 and p99, from the `_bucket` series. Unit `s`.

## Hints
- `sum(rate(A[5m])) / sum(rate(B[5m]))` is the shape of every ratio in PromQL.
- `"legendFormat": "p99"` names a line in the legend.
- Want to see it rendered? `docker run -d -p 3001:3000 grafana/grafana`, log in
  at http://localhost:3001 (admin/admin), then Dashboards → New → Import and
  paste your JSON. Panels show "No data" without a Prometheus, but the layout,
  units and variable are all there.

## Check your work
```
./onboard validate observability/04
```
