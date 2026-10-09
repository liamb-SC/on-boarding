// Static checks on alerts.yml, then a small simulation: each alert is
// evaluated once a minute over 90 minutes of sample data, honouring `for:`.
// It's a simplified Prometheus: alert exprs must be "<recorded series> > <number>".
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, fromSandbox, SANDBOX } from '../../../../lib/checks.mjs';

const { parse } = await fromSandbox('yaml');
let doc = {};
await check('alerts.yml is valid YAML', () => {
  doc = parse(readFileSync(path.join(SANDBOX, 'alerts.yml'), 'utf8')) ?? {};
});
const rules = (doc.groups ?? []).flatMap((g) => g.rules ?? []);
const recorded = new Set(rules.filter((r) => r.record).map((r) => r.record));
const alerts = rules.filter((r) => r.alert);
const get = (name) => alerts.find((a) => a.alert === name);

const minutes = (d) => {
  const m = String(d ?? '').match(/^(\d+)([smh])$/);
  return m ? Number(m[1]) * { s: 1 / 60, m: 1, h: 60 }[m[2]] : NaN;
};

// 90 minutes of per-minute samples for the two recorded series.
const series = (base, spans) => Array.from({ length: 90 }, (_, t) => spans.find(([a, b]) => t >= a && t <= b)?.[2] ?? base);
const data = {
  'service:http_error_ratio:rate5m': series(0.004, [[10, 12, 0.2], [40, 55, 0.12], [70, 80, 0.03]]),
  'service:http_request_duration_seconds:p99_5m': series(0.21, [[20, 27, 0.9], [60, 75, 0.8], [80, 89, 0.45]]),
};
// Minutes at which an alert is firing: condition continuously true for >= `for`.
function firing(rule) {
  const m = String(rule.expr ?? '').trim().match(/^([a-zA-Z_:][\w:]*)(\{[^}]*\})?\s*(>=|>)\s*([\d.]+(?:e-?\d+)?)$/);
  if (!m) throw new Error(`keep the expr to "<recorded series> > <threshold>", got: ${String(rule.expr).trim()}`);
  const values = data[m[1]];
  if (!values) throw new Error(`alert on one of the recorded series (${[...recorded].join(', ')}), not ${m[1]}`);
  const forMin = minutes(rule.for ?? '0m');
  const cond = (v) => (m[3] === '>' ? v > Number(m[4]) : v >= Number(m[4]));
  const out = [];
  let since = null;
  values.forEach((v, t) => {
    if (!cond(v)) { since = null; return; }
    since ??= t;
    if (t - since >= forMin) out.push(t);
  });
  return out;
}
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
// [12, 42, 43, 44] -> "fires at minutes 12, 42–44"
const describe = (ts) => {
  if (!ts.length) return 'never fires';
  const runs = [];
  for (const t of ts) {
    const last = runs.at(-1);
    if (last && t === last[1] + 1) last[1] = t; else runs.push([t, t]);
  }
  return `fires at minutes ${runs.map(([a, b]) => (a === b ? a : `${a}–${b}`)).join(', ')}`;
};

for (const [name, severity, forDur] of [['HighErrorRate', 'page', '5m'], ['HighLatencyP99', 'ticket', '10m']]) {
  await check(`${name}: exists, with for: ${forDur} and severity: ${severity}`, () => {
    const a = get(name);
    expect(a, `no alert named ${name}. Alerts: ${alerts.map((x) => x.alert).join(', ') || 'none'}`);
    expect(minutes(a.for) === minutes(forDur), `for is ${JSON.stringify(a.for)}`);
    expect(a.labels?.severity === severity, `labels.severity is ${JSON.stringify(a.labels?.severity)}`);
  });
  await check(`${name}: annotations have a summary naming the service, and an https runbook_url`, () => {
    const an = get(name)?.annotations ?? {};
    expect(/\{\{\s*\$labels\.service\s*\}\}/.test(an.summary ?? ''), 'summary should include {{ $labels.service }}');
    expect(/^https:\/\/\S+$/.test(an.runbook_url ?? ''), `runbook_url is ${JSON.stringify(an.runbook_url)}`);
  });
}

await check('HighErrorRate on the sample data: ignores the 3-minute blip and the 3% wobble, fires for the incident', () => {
  const got = firing(get('HighErrorRate') ?? {});
  const want = range(45, 55);
  expect(JSON.stringify(got) === JSON.stringify(want),
    `it ${describe(got)}. Expected minutes 45–55: the ratio is over 5% from minute 40, and the alert needs 5 minutes of that`);
});
await check('HighLatencyP99 on the sample data: ignores the 8-minute spike, fires for the long one', () => {
  const got = firing(get('HighLatencyP99') ?? {});
  const want = range(70, 75);
  expect(JSON.stringify(got) === JSON.stringify(want),
    `it ${describe(got)}. Expected minutes 70–75: p99 is over 0.5s from minute 60 (the series is in seconds), and the alert needs 10 minutes of that`);
});
await check('recording rules are still there and alert names are unique', () => {
  expect(recorded.size === 2, `recording rules: ${[...recorded].join(', ')}`);
  expect(new Set(alerts.map((a) => a.alert)).size === alerts.length, 'duplicate alert names');
});
