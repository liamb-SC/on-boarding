#!/usr/bin/env bash
source "$REPO_ROOT/lib/sandbox.sh"
source "$REPO_ROOT/lib/node.sh"
need node "Install Node.js 20+ (https://nodejs.org or nvm)."

sandbox_reset
put dashboard.json <<'JSON'
{
  "uid": "shop-api-red",
  "title": "TODO",
  "tags": [],
  "schemaVersion": 39,
  "time": { "from": "now-6h", "to": "now" },
  "refresh": "",
  "templating": { "list": [] },
  "panels": []
}
JSON
# A complete panel for a different metric, to copy the shape from.
put example-panel.json <<'JSON'
{
  "type": "timeseries",
  "title": "CPU usage by pod",
  "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
  "datasource": { "type": "prometheus", "uid": "prometheus" },
  "targets": [
    {
      "refId": "A",
      "expr": "sum by (pod) (rate(container_cpu_usage_seconds_total{namespace=\"shop\"}[5m]))",
      "legendFormat": "{{pod}}"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "short",
      "thresholds": { "mode": "absolute", "steps": [ { "color": "green", "value": null }, { "color": "red", "value": 0.8 } ] }
    },
    "overrides": []
  }
}
JSON
put example-variable.json <<'JSON'
{
  "name": "namespace",
  "type": "query",
  "datasource": { "type": "prometheus", "uid": "prometheus" },
  "query": "label_values(kube_pod_info, namespace)",
  "refresh": 1
}
JSON
sb_commit_all "Empty shop-api dashboard"
