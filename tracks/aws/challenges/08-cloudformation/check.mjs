import { check, expect, watchdog } from '../../../../lib/checks.mjs';
import { config, done, notFound, sdk } from '../../fixtures/validator.mjs';

watchdog(60000);
const cf = await sdk('cloudformation');
const s3Sdk = await sdk('s3');
const sqsSdk = await sdk('sqs');
const ssmSdk = await sdk('ssm');
const cfn = new cf.CloudFormationClient(config);
const s3 = new s3Sdk.S3Client(config);
const sqs = new sqsSdk.SQSClient(config);
const ssm = new ssmSdk.SSMClient(config);
const StackName = 'onboard-app';

let stack;
await check(`stack ${StackName} deployed successfully`, async () => {
  try {
    [stack] = (await cfn.send(new cf.DescribeStacksCommand({ StackName }))).Stacks;
  } catch (e) {
    throw new Error(/does not exist/i.test(e.message) || notFound(e) ? 'no such stack — run node deploy.mjs' : e.message);
  }
  expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE'].includes(stack.StackStatus), `status is ${stack.StackStatus}`);
});

await check('it was deployed with Env = dev', () => {
  expect(stack, 'no stack');
  const env = stack.Parameters?.find((p) => p.ParameterKey === 'Env')?.ParameterValue;
  expect(env === 'dev', `Env is ${env}`);
});

let resources = [];
await check('it manages a bucket (AssetsBucket), a queue (JobsQueue) and a parameter (QueueUrlParam)', async () => {
  expect(stack, 'no stack');
  ({ StackResources: resources = [] } = await cfn.send(new cf.DescribeStackResourcesCommand({ StackName })));
  const want = { AssetsBucket: 'AWS::S3::Bucket', JobsQueue: 'AWS::SQS::Queue', QueueUrlParam: 'AWS::SSM::Parameter' };
  for (const [id, type] of Object.entries(want)) {
    const r = resources.find((x) => x.LogicalResourceId === id);
    expect(r, `no resource ${id}`);
    expect(r.ResourceType === type, `${id} is a ${r.ResourceType}, expected ${type}`);
  }
});

await check('the bucket onboard-cfn-dev-assets exists', async () => {
  await s3.send(new s3Sdk.HeadBucketCommand({ Bucket: 'onboard-cfn-dev-assets' })).catch((e) => {
    throw new Error(notFound(e) ? 'not found' : e.message);
  });
});

let queue;
await check('the queue onboard-cfn-dev-jobs exists with a 60s visibility timeout', async () => {
  let url;
  try {
    ({ QueueUrl: url } = await sqs.send(new sqsSdk.GetQueueUrlCommand({ QueueName: 'onboard-cfn-dev-jobs' })));
  } catch (e) {
    throw new Error(notFound(e) ? 'not found' : e.message);
  }
  const { Attributes } = await sqs.send(new sqsSdk.GetQueueAttributesCommand({ QueueUrl: url, AttributeNames: ['All'] }));
  queue = { url, arn: Attributes.QueueArn };
  expect(Attributes.VisibilityTimeout === '60', `VisibilityTimeout is ${Attributes.VisibilityTimeout}`);
});

const outputs = () => Object.fromEntries((stack?.Outputs ?? []).map((o) => [o.OutputKey, o.OutputValue]));

await check('outputs QueueUrl and QueueArn match the real queue', () => {
  expect(queue, 'no queue');
  const out = outputs();
  expect(out.QueueUrl, 'no QueueUrl output');
  expect(out.QueueArn === queue.arn, `QueueArn output is ${out.QueueArn}, the queue's ARN is ${queue.arn}`);
  expect(out.QueueUrl.endsWith('/onboard-cfn-dev-jobs'), `QueueUrl output is ${out.QueueUrl}`);
});

await check('/onboard/dev/jobs-queue-url holds the queue URL', async () => {
  let value;
  try {
    value = (await ssm.send(new ssmSdk.GetParameterCommand({ Name: '/onboard/dev/jobs-queue-url' }))).Parameter.Value;
  } catch (e) {
    throw new Error(notFound(e) || e.name === 'ParameterNotFound' ? 'not found' : e.message);
  }
  expect(value === outputs().QueueUrl, `value is ${value}, the stack's QueueUrl is ${outputs().QueueUrl}`);
});

await check('the deployed template references the queue instead of hard-coding names and URLs', async () => {
  expect(stack, 'no stack');
  const { TemplateBody = '' } = await cfn.send(new cf.GetTemplateCommand({ StackName }));
  const body = typeof TemplateBody === 'string' ? TemplateBody : JSON.stringify(TemplateBody);
  expect(/GetAtt/.test(body), 'no !GetAtt (use !GetAtt JobsQueue.Arn for the ARN output)');
  expect(/(!Ref|"Ref"|Ref:)\s*"?JobsQueue\b/.test(body), 'nothing references JobsQueue with !Ref');
  expect(!/localhost|000000000000|onboard-cfn-dev-/.test(body), 'found a hard-coded URL, account or "dev" name: use !Ref / !Sub with ${Env}');
});

done();
