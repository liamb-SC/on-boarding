# Track: Observability

How you find out what your service is doing in production: structured logs,
latency percentiles, traces and metrics with OpenTelemetry, dashboards and
alerts. Each challenge is small, about 10 to 30 minutes, and runs locally
without Docker.

## Requirements
Node.js 20+ and network access to the npm registry. Setups install `pino`
(01), the OpenTelemetry API and SDK (03), or `yaml` (05).
Docker is optional: it lets you preview the dashboard in Grafana (04) and
lint rules with `promtool` (05).

## Learning objectives
By the end you can:
- Write structured JSON logs with levels, child loggers, correlation IDs and redaction.
- Compute p50/p95/p99 from raw latencies and explain why averages and fan-out hide pain.
- Instrument Node code with OpenTelemetry spans (parent/child, errors) and
  metrics (counters, histograms), and explain the API vs SDK split.
- Build a RED dashboard as code with correct PromQL for rates, error ratios and
  histogram quantiles.
- Write alert rules with sensible thresholds, `for:` durations, severities
  and runbooks, and check them against sample data.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | structured-logging | pino, levels, `LOG_LEVEL`, child loggers, request IDs, `{ err }`, redaction |
| 02 | latency-percentiles | nearest-rank percentiles, mean vs p99, tail latency, fan-out |
| 03 | opentelemetry | tracers, spans, `startActiveSpan`, span status, counters, histograms |
| 04 | dashboards | RED method, Grafana JSON, `rate()`, error ratio, `histogram_quantile`, variables |
| 05 | alerting | alerting rules, recording rules, `for:`, severity, annotations, runbooks |

Frontend tracing (browser spans, `traceparent` propagation into the backend)
is covered in the web-basics track.

Start with: `./onboard start observability/01`
