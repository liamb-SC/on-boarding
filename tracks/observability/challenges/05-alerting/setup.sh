#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."
need npm

sandbox_reset
printf 'node_modules/\n' | put .gitignore
put package.json <<'JSON'
{
  "name": "shop-api-alerts",
  "private": true,
  "devDependencies": { "yaml": "^2.5.0" }
}
JSON
put alerts.yml <<'YAML'
groups:
  - name: shop-api-recording
    rules:
      # Recording rules: Prometheus pre-computes these every evaluation, so
      # alerts (and dashboards) query a cheap, readable series.
      - record: service:http_error_ratio:rate5m
        expr: |
          sum by (service) (rate(http_requests_total{status=~"5.."}[5m]))
            /
          sum by (service) (rate(http_requests_total[5m]))
      - record: service:http_request_duration_seconds:p99_5m
        expr: histogram_quantile(0.99, sum by (service, le) (rate(http_request_duration_seconds_bucket[5m])))

  - name: shop-api-alerts
    rules: []
    # TODO: HighErrorRate and HighLatencyP99 (see the README)
YAML

npm_install_sandbox   # yaml, used by the validator to read alerts.yml
sb_commit_all "Recording rules for shop-api"
