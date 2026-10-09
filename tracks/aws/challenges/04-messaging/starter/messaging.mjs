// Run with: node messaging.mjs   (re-runnable: every call below is idempotent)
import { SQSClient, CreateQueueCommand, GetQueueAttributesCommand, SetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { SNSClient, CreateTopicCommand, SubscribeCommand } from '@aws-sdk/client-sns';
import { EventBridgeClient, PutRuleCommand, PutTargetsCommand } from '@aws-sdk/client-eventbridge';
import { config } from './aws.mjs';

const sqs = new SQSClient(config);
const sns = new SNSClient(config);
const events = new EventBridgeClient(config);

// Create a queue (or get the existing one) and return its URL and ARN.
async function queue(QueueName) {
  const { QueueUrl } = await sqs.send(new CreateQueueCommand({ QueueName }));
  const { Attributes } = await sqs.send(new GetQueueAttributesCommand({ QueueUrl, AttributeNames: ['QueueArn'] }));
  return { url: QueueUrl, arn: Attributes.QueueArn };
}

// Let one AWS service (e.g. 'sns.amazonaws.com') send messages to a queue, but
// only on behalf of one source (the topic or rule ARN).
async function allowToSend(q, service, sourceArn) {
  const policy = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: { Service: service },
      Action: 'sqs:SendMessage',
      Resource: q.arn,
      Condition: { ArnEquals: { 'aws:SourceArn': sourceArn } },
    }],
  };
  await sqs.send(new SetQueueAttributesCommand({ QueueUrl: q.url, Attributes: { Policy: JSON.stringify(policy) } }));
}

const email = await queue('orders-email');
const analytics = await queue('orders-analytics');
const bigOrders = await queue('big-orders');

// 1. Fan-out: create the SNS topic "orders" and subscribe BOTH orders-email and
//    orders-analytics to it (Protocol 'sqs', Endpoint = the queue ARN). Turn on
//    raw message delivery for orders-analytics only.
//    Then let the topic send to both queues with allowToSend().

// 2. Routing: on the default event bus, create the rule "big-orders" matching
//    events with source "onboard.shop", detail-type "OrderPlaced" and a
//    detail.total of 100 or more. Target the big-orders queue (PutTargets) and
//    let the rule send to it with allowToSend().
