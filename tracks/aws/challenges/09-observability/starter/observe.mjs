// Run with: node observe.mjs   (re-runnable)
import {
  CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand,
  PutRetentionPolicyCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchClient, PutMetricDataCommand, PutMetricAlarmCommand } from '@aws-sdk/client-cloudwatch';
import { config } from './aws.mjs';

const logs = new CloudWatchLogsClient(config);
const cw = new CloudWatchClient(config);

// Ignore "already exists" so the script can be re-run.
const ignoreExists = (e) => { if (e.name !== 'ResourceAlreadyExistsException') throw e; };

// 1. LOGS
//    - Log group /onboard/checkout, keeping logs for 7 days.
//    - A log stream in it (any name, e.g. `run-${Date.now()}`).
//    - At least 3 events, each a JSON string like
//        {"level":"INFO","msg":"checkout started","orderId":"o-1"}
//      and at least one with "level":"ERROR".
//      Each event is { timestamp: Date.now(), message: '...' }.

// 2. METRICS, in the namespace Onboard/Checkout, each with the dimension
//    Service=checkout:
//    - CheckoutLatency, unit Milliseconds: at least 5 data points.
//    - Errors, unit Count: at least 1 data point.

// 3. ALARM "checkout-errors": goes off when the Sum of Errors (Service=checkout)
//    over 60 seconds is >= 1, for 1 evaluation period. Treat missing data as
//    "notBreaching" (no data means no errors).
