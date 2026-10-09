import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { config, done, gradeAnswers, notFound, readAnswers, sdk } from '../../fixtures/validator.mjs';

watchdog(60000);
const logsSdk = await sdk('cloudwatch-logs');
const cwSdk = await sdk('cloudwatch');
const logs = new logsSdk.CloudWatchLogsClient(config);
const cw = new cwSdk.CloudWatchClient(config);
const logGroupName = '/onboard/checkout';
const Namespace = 'Onboard/Checkout';
const Dimensions = [{ Name: 'Service', Value: 'checkout' }];
let startedAt;
try {
  startedAt = Number(readFileSync(path.join(SANDBOX, '.git/note_started_at'), 'utf8'));
} catch {
  startedAt = Date.now() - 24 * 3600 * 1000;
}

let group;
await check(`log group ${logGroupName} exists with 7-day retention`, async () => {
  const { logGroups = [] } = await logs.send(new logsSdk.DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName }));
  group = logGroups.find((g) => g.logGroupName === logGroupName);
  expect(group, 'not found — run node observe.mjs');
  expect(group.retentionInDays === 7, `retention is ${group.retentionInDays ?? 'never expire'}`);
});

let events = [];
await check('it has at least 3 log events, all JSON', async () => {
  expect(group, 'no log group');
  try {
    ({ events = [] } = await logs.send(new logsSdk.FilterLogEventsCommand({ logGroupName, limit: 1000 })));
  } catch (e) {
    throw new Error(notFound(e) ? 'no events' : e.message);
  }
  expect(events.length >= 3, `found ${events.length}`);
  const notJson = events.filter((e) => { try { return typeof JSON.parse(e.message) !== 'object'; } catch { return true; } });
  expect(!notJson.length, `not JSON: ${notJson[0]?.message.slice(0, 60)}`);
});

await check('at least one event is {"level":"ERROR", ...}', () => {
  const errors = events.filter((e) => { try { return JSON.parse(e.message).level === 'ERROR'; } catch { return false; } });
  expect(errors.length, 'no event with level ERROR');
});

// Metric data can't be deleted, so only count data points from the first full
// minute after setup (CloudWatch rounds StartTime down to the minute).
const since = new Date(Math.ceil(startedAt / 60000) * 60000);
const window = { StartTime: since, EndTime: new Date(Date.now() + 60000), Period: 60 };
const tooEarly = () => (Date.now() < since.getTime() + 5000
  ? ' (data from the first minute after setup is ignored: wait a moment and run observe.mjs again)' : '');

// Data points sent since setup, summed over all periods.
async function samples(MetricName) {
  const { Datapoints = [] } = await cw.send(new cwSdk.GetMetricStatisticsCommand({
    Namespace, MetricName, Dimensions, ...window, Statistics: ['SampleCount'],
  }));
  return Datapoints.reduce((n, d) => n + (d.SampleCount ?? 0), 0);
}

await check(`${Namespace} CheckoutLatency (Service=checkout): at least 5 data points, in Milliseconds`, async () => {
  const n = await samples('CheckoutLatency');
  expect(n >= 5, `found ${n} since the challenge started${tooEarly()}`);
  const { Metrics = [] } = await cw.send(new cwSdk.ListMetricsCommand({ Namespace, MetricName: 'CheckoutLatency' }));
  expect(Metrics.some((m) => JSON.stringify(m.Dimensions) === JSON.stringify(Dimensions)), 'no CheckoutLatency metric with exactly the dimension Service=checkout');
  const { Datapoints = [] } = await cw.send(new cwSdk.GetMetricStatisticsCommand({
    Namespace, MetricName: 'CheckoutLatency', Dimensions, ...window, Statistics: ['SampleCount'], Unit: 'Milliseconds',
  }));
  expect(Datapoints.length, 'no data points with Unit Milliseconds');
});

await check(`${Namespace} Errors (Service=checkout): at least 1 data point`, async () => {
  const n = await samples('Errors');
  expect(n >= 1, `found ${n} since the challenge started${tooEarly()}`);
});

await check('alarm checkout-errors: Sum of Errors >= 1 over 60s, 1 period, missing data = notBreaching', async () => {
  const { MetricAlarms = [] } = await cw.send(new cwSdk.DescribeAlarmsCommand({ AlarmNames: ['checkout-errors'] }));
  const a = MetricAlarms[0];
  expect(a, 'no alarm named checkout-errors');
  const ge1 = a.ComparisonOperator === 'GreaterThanOrEqualToThreshold' && a.Threshold === 1;
  const gt0 = a.ComparisonOperator === 'GreaterThanThreshold' && a.Threshold === 0;
  expect(ge1 || gt0, `fires when ${a.ComparisonOperator} ${a.Threshold}`);
  expectEqual(
    { ns: a.Namespace, metric: a.MetricName, stat: a.Statistic, period: a.Period, periods: a.EvaluationPeriods, missing: a.TreatMissingData, dims: a.Dimensions },
    { ns: Namespace, metric: 'Errors', stat: 'Sum', period: 60, periods: 1, missing: 'notBreaching', dims: Dimensions },
  );
});

const answers = (() => { try { return readAnswers('trace-answers.json'); } catch (e) { return e; } })();
const near = (got, want, label) => {
  expect(!(answers instanceof Error), answers.message);
  expect(typeof got === 'number', `${label} should be a number of milliseconds`);
  expect(Math.abs(got - want) <= 1, `${label} is not right yet`);
};

await check('trace: total duration (total-ms)', () => near(answers['total-ms'], 2250, 'total-ms'));
await check('trace: cold-start initialization (init-ms)', () => near(answers['init-ms'], 380, 'init-ms'));
await check('trace: the multiple-choice questions', () => {
  expect(!(answers instanceof Error), answers.message);
  gradeAnswers(answers, {
    'slowest-call': 'a',
    'root-cause': 'c',
    'fault-means': 'b',
    searchable: 'a',
    instrument: 'c',
    'which-is-a-segment': 'c',
  });
});

done();
