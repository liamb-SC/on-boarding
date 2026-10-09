import { check, expect, watchdog } from '../../../../lib/checks.mjs';
import { config, done, nonce, notFound, sdk, sleep } from '../../fixtures/validator.mjs';

watchdog(90000);
const sqsSdk = await sdk('sqs');
const snsSdk = await sdk('sns');
const ebSdk = await sdk('eventbridge');
const sqs = new sqsSdk.SQSClient(config);
const sns = new snsSdk.SNSClient(config);
const events = new ebSdk.EventBridgeClient(config);

const queues = {};
for (const name of ['orders-email', 'orders-analytics', 'big-orders']) {
  await check(`queue ${name} exists`, async () => {
    try {
      const { QueueUrl } = await sqs.send(new sqsSdk.GetQueueUrlCommand({ QueueName: name }));
      const { Attributes } = await sqs.send(new sqsSdk.GetQueueAttributesCommand({ QueueUrl, AttributeNames: ['All'] }));
      queues[name] = { url: QueueUrl, arn: Attributes.QueueArn, policy: Attributes.Policy };
    } catch (e) {
      throw new Error(notFound(e) || /NonExistentQueue/.test(e.name) ? 'not found — run node messaging.mjs' : e.message);
    }
  });
}

// Read (and delete) everything that arrives on a queue for up to `ms`,
// stopping early once `until(bodies)` is true.
async function drain(q, ms, until = () => false) {
  const bodies = [];
  const end = Date.now() + ms;
  while (Date.now() < end && !until(bodies)) {
    const { Messages = [] } = await sqs.send(new sqsSdk.ReceiveMessageCommand({
      QueueUrl: q.url, MaxNumberOfMessages: 10, WaitTimeSeconds: 1,
    }));
    for (const m of Messages) {
      bodies.push(m.Body);
      await sqs.send(new sqsSdk.DeleteMessageCommand({ QueueUrl: q.url, ReceiptHandle: m.ReceiptHandle }));
    }
  }
  return bodies;
}

// Does the queue policy let `service` send, scoped to `sourceArn`?
function allows(q, service, sourceArn) {
  expect(q?.policy, 'the queue has no Policy attribute');
  const statements = [].concat(JSON.parse(q.policy).Statement ?? []);
  const ok = statements.some((s) => {
    const principals = [].concat(s.Principal?.Service ?? []);
    const actions = [].concat(s.Action ?? []);
    return s.Effect === 'Allow' && principals.includes(service) &&
      actions.some((a) => ['sqs:SendMessage', 'sqs:*'].includes(a)) &&
      JSON.stringify(s.Condition ?? {}).includes(sourceArn);
  });
  expect(ok, `no statement allows ${service} to sqs:SendMessage with aws:SourceArn = ${sourceArn}`);
}

let topicArn;
await check('SNS topic orders exists', async () => {
  const { Topics = [] } = await sns.send(new snsSdk.ListTopicsCommand({}));
  topicArn = Topics.map((t) => t.TopicArn).find((a) => a.endsWith(':orders'));
  expect(topicArn, 'not found');
});

let subs = [];
await check('orders-email and orders-analytics are both subscribed to it (protocol sqs)', async () => {
  expect(topicArn, 'no topic');
  ({ Subscriptions: subs = [] } = await sns.send(new snsSdk.ListSubscriptionsByTopicCommand({ TopicArn: topicArn })));
  for (const name of ['orders-email', 'orders-analytics']) {
    expect(subs.some((s) => s.Protocol === 'sqs' && s.Endpoint === queues[name]?.arn), `${name} is not subscribed`);
  }
});

await check('raw message delivery is on for orders-analytics, off for orders-email', async () => {
  const raw = async (name) => {
    const sub = subs.find((s) => s.Endpoint === queues[name]?.arn);
    expect(sub, `${name} is not subscribed`);
    const { Attributes = {} } = await sns.send(new snsSdk.GetSubscriptionAttributesCommand({ SubscriptionArn: sub.SubscriptionArn }));
    return Attributes.RawMessageDelivery === 'true';
  };
  expect(await raw('orders-analytics'), 'orders-analytics should use raw delivery');
  expect(!(await raw('orders-email')), 'orders-email should keep the SNS envelope');
});

await check('both fan-out queues have a policy letting the topic send to them', () => {
  expect(topicArn, 'no topic');
  allows(queues['orders-email'], 'sns.amazonaws.com', topicArn);
  allows(queues['orders-analytics'], 'sns.amazonaws.com', topicArn);
});

await check('a message published to the topic reaches both queues (envelope on email, raw on analytics)', async () => {
  expect(topicArn && queues['orders-email'] && queues['orders-analytics'], 'topic or queues missing');
  const id = nonce('order');
  const message = JSON.stringify({ orderId: id, total: 12 });
  await sns.send(new snsSdk.PublishCommand({ TopicArn: topicArn, Message: message }));
  const has = (b) => b.some((x) => x.includes(id));
  const [email, analytics] = await Promise.all([
    drain(queues['orders-email'], 10000, has),
    drain(queues['orders-analytics'], 10000, has),
  ]);
  const e = email.find((x) => x.includes(id));
  const a = analytics.find((x) => x.includes(id));
  expect(e, 'it never reached orders-email');
  expect(a, 'it never reached orders-analytics');
  expect(JSON.parse(e).Message === message, 'orders-email should get the SNS envelope, with the order in "Message"');
  expect(a === message, 'orders-analytics should get exactly the published message (raw)');
});

let rule;
await check('EventBridge rule big-orders exists on the default bus and targets the big-orders queue', async () => {
  try {
    rule = await events.send(new ebSdk.DescribeRuleCommand({ Name: 'big-orders' }));
  } catch (e) {
    throw new Error(notFound(e) ? 'rule not found' : e.message);
  }
  expect(!rule.EventBusName || rule.EventBusName === 'default', `it's on bus ${rule.EventBusName}`);
  const { Targets = [] } = await events.send(new ebSdk.ListTargetsByRuleCommand({ Rule: 'big-orders' }));
  expect(Targets.some((t) => t.Arn === queues['big-orders']?.arn), 'no target pointing at the big-orders queue');
});

await check('the big-orders queue has a policy letting the rule send to it', () => {
  expect(rule?.Arn, 'no rule');
  allows(queues['big-orders'], 'events.amazonaws.com', rule.Arn);
});

await check('the rule routes only shop OrderPlaced events with total >= 100', async () => {
  expect(rule && queues['big-orders'], 'rule or queue missing');
  const run = nonce('evt');
  const ev = (tag, total, source = 'onboard.shop', type = 'OrderPlaced') => ({
    Source: source, DetailType: type, Detail: JSON.stringify({ orderId: `${run}-${tag}`, total }),
  });
  const cases = [
    ev('big', 250), ev('edge', 100),                              // should arrive
    ev('small', 99), ev('other-source', 500, 'onboard.warehouse'), // should not
    ev('other-type', 500, 'onboard.shop', 'OrderCancelled'),
  ];
  const put = await events.send(new ebSdk.PutEventsCommand({ Entries: cases }));
  expect(!put.FailedEntryCount, `PutEvents failed: ${JSON.stringify(put.Entries)}`);
  const want = [`${run}-big`, `${run}-edge`];
  const got = await drain(queues['big-orders'], 10000, (b) => want.every((w) => b.some((x) => x.includes(w))));
  await sleep(1500);
  got.push(...(await drain(queues['big-orders'], 1500)));
  const arrived = ['big', 'edge', 'small', 'other-source', 'other-type']
    .filter((tag) => got.some((x) => x.includes(`${run}-${tag}"`)));
  expect(arrived.includes('big'), 'a total of 250 did not arrive');
  expect(arrived.includes('edge'), 'a total of exactly 100 did not arrive (>= 100)');
  const extra = arrived.filter((t) => !['big', 'edge'].includes(t));
  expect(!extra.length, `these should have been filtered out: ${extra.join(', ')}`);
});

done();
