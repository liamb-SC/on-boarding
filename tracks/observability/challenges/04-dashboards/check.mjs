// Static checks on a Grafana dashboard model. Panels are recognised by what
// they query, not by their titles.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, SANDBOX } from '../../../../lib/checks.mjs';

let d = {};
await check('dashboard.json is valid JSON', () => {
  d = JSON.parse(readFileSync(path.join(SANDBOX, 'dashboard.json'), 'utf8'));
});
const panels = Array.isArray(d.panels) ? d.panels : [];
const exprs = (p) => (p.targets ?? []).map((t) => String(t.expr ?? '')).filter(Boolean);
const unit = (p) => p.fieldConfig?.defaults?.unit;
const usesVar = (e) => /\$\{?service\}?/.test(e);

const errorsPanel = panels.find((p) => exprs(p).some((e) => /status\s*=~\s*"5/.test(e)));
const ratePanel = panels.find((p) => p !== errorsPanel && exprs(p).some((e) => /http_requests_total/.test(e)));
const latencyPanel = panels.find((p) => exprs(p).some((e) => /histogram_quantile/.test(e)));

await check('the dashboard has a real title and the tag "red"', () => {
  expect(d.title && d.title !== 'TODO', 'set a title');
  expect((d.tags ?? []).includes('red'), `tags are ${JSON.stringify(d.tags)}`);
});
await check('it auto-refreshes (refresh set, e.g. "30s")', () => expect(/^\d+[smh]$/.test(d.refresh ?? ''), `refresh is ${JSON.stringify(d.refresh)}`));
await check('a `service` template variable', () =>
  expect((d.templating?.list ?? []).some((v) => v.name === 'service'), 'add one to templating.list (see example-variable.json)'));
await check('every panel has a title, a type and a gridPos inside the 24-column grid', () => {
  expect(panels.length >= 3, `${panels.length} panel(s). Need at least Rate, Errors and Duration`);
  for (const p of panels) {
    const g = p.gridPos ?? {};
    expect(p.title && p.type, `a panel is missing its title or type: ${JSON.stringify(p.title)}`);
    expect([g.x, g.y, g.w, g.h].every(Number.isInteger) && g.x + g.w <= 24, `"${p.title}" has gridPos ${JSON.stringify(p.gridPos)}`);
  }
});
await check('panels do not overlap', () => {
  expect(panels.length > 0, 'no panels yet');
  const boxes = panels.map((p) => ({ t: p.title, ...p.gridPos }));
  for (const [i, a] of boxes.entries()) for (const b of boxes.slice(i + 1)) {
    const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    expect(!overlap, `"${a.t}" and "${b.t}" overlap`);
  }
});

await check('Rate: requests per second from rate(http_requests_total[...]) for $service', () => {
  expect(ratePanel, 'no panel queries http_requests_total (other than the errors panel)');
  const e = exprs(ratePanel).join(' ');
  expect(/\b(i?rate)\s*\(\s*http_requests_total\b[^\]]*\[[^\]]+\]\s*\)/.test(e), `use rate(http_requests_total{...}[5m]): a counter's raw value only ever goes up. Got: ${e}`);
  expect(/\bsum\b/.test(e), 'sum the per-instance rates (sum(...) or sum by (route) (...))');
  expect(usesVar(e), 'filter on service="$service"');
});
await check('Rate panel unit is requests/sec (reqps)', () => expect(unit(ratePanel ?? {}) === 'reqps', `unit is ${JSON.stringify(unit(ratePanel ?? {}))}`));

await check('Errors: the share of requests that are 5xx (errors / total) for $service', () => {
  expect(errorsPanel, 'no panel filters on status=~"5.."');
  const e = exprs(errorsPanel).join(' ');
  expect(/\brate\s*\(/.test(e) && /\//.test(e), `divide the 5xx rate by the total rate. Got: ${e}`);
  expect((e.match(/\$\{?service\}?/g) ?? []).length >= 2, 'filter both the top and the bottom of the ratio on $service');
});
await check('Errors panel unit is a ratio (percentunit) with a red threshold at 5% (0.05)', () => {
  expect(unit(errorsPanel ?? {}) === 'percentunit', `unit is ${JSON.stringify(unit(errorsPanel ?? {}))}`);
  const steps = errorsPanel.fieldConfig?.defaults?.thresholds?.steps ?? [];
  expect(steps.some((s) => s.value === 0.05), `threshold steps: ${JSON.stringify(steps.map((s) => s.value))}`);
});

await check('Duration: p50 and p99 with histogram_quantile over the _bucket series', () => {
  expect(latencyPanel, 'no panel uses histogram_quantile');
  const e = exprs(latencyPanel);
  for (const q of ['0.5', '0.99']) {
    expect(e.some((x) => new RegExp(`histogram_quantile\\(\\s*${q.replace('.', '\\.')}0*\\s*,`).test(x)),
      `no histogram_quantile(${q}, ...) query`);
  }
  expect(e.every((x) => /http_request_duration_seconds_bucket/.test(x) && usesVar(x)), 'query http_request_duration_seconds_bucket for $service');
});
await check('Duration queries aggregate by le: sum by (le) (rate(..._bucket[5m]))', () => {
  const e = exprs(latencyPanel ?? {});
  expect(e.length && e.every((x) => /by\s*\([^)]*\ble\b[^)]*\)/.test(x) && /\brate\s*\(/.test(x)),
    'histogram_quantile needs the bucket rates summed by (le). Without it you get one line per pod and bucket');
});
await check('Duration panel unit is seconds (s)', () => expect(unit(latencyPanel ?? {}) === 's', `unit is ${JSON.stringify(unit(latencyPanel ?? {}))}`));
