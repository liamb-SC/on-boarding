// Run with: node try.mjs   — publishes a test order to the topic, puts two
// events on the default bus, then prints what landed in each queue.
import { SQSClient, GetQueueUrlCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { arn, config } from './aws.mjs';

const sqs = new SQSClient(config);
const sns = new SNSClient(config);
const events = new EventBridgeClient(config);

await sns.send(new PublishCommand({ TopicArn: arn('sns', 'orders'), Message: JSON.stringify({ orderId: 'o-1', total: 42 }) }));
const order = (total) => ({ Source: 'onboard.shop', DetailType: 'OrderPlaced', Detail: JSON.stringify({ orderId: `o-${total}`, total }) });
const put = await events.send(new PutEventsCommand({ Entries: [order(30), order(300)] }));
if (put.FailedEntryCount) console.log('PutEvents failures:', put.Entries);

for (const QueueName of ['orders-email', 'orders-analytics', 'big-orders']) {
  const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName }));
  const { Messages = [] } = await sqs.send(new ReceiveMessageCommand({ QueueUrl, MaxNumberOfMessages: 10, WaitTimeSeconds: 2 }));
  console.log(`\n${QueueName}: ${Messages.length} message(s)`);
  for (const m of Messages) {
    console.log(' ', m.Body);
    await sqs.send(new DeleteMessageCommand({ QueueUrl, ReceiptHandle: m.ReceiptHandle }));
  }
}
