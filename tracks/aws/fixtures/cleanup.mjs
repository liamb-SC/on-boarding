// cleanup.mjs — delete whatever an earlier attempt at a challenge left behind
// in LocalStack, so `./onboard reset` gives a genuinely fresh start.
//
//   SANDBOX_DIR=... node cleanup.mjs '{"buckets":["x"],"queues":["y"]}'
//
// Keys: buckets, volumeTags (Name tag values), functions, queues, topics,
// rules, tables, restApis, roles, policies, secrets, parameters, stacks,
// logGroups, alarms. Missing resources are fine. The SDK clients come from
// the sandbox's node_modules, so only list kinds the sandbox installs.

import { createRequire } from 'node:module';
import path from 'node:path';

process.env.AWS_SDK_JS_NODE_VERSION_SUPPORT_WARNING_DISABLED ??= 'true';
const spec = JSON.parse(process.argv[2] ?? '{}');
const req = createRequire(path.join(process.env.SANDBOX_DIR, 'package.json'));
const config = {
  endpoint: process.env.AWS_ENDPOINT_URL ?? 'http://localhost:4566',
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  forcePathStyle: true,
};
const sdk = (name) => req(`@aws-sdk/client-${name}`);
let removed = 0;

// Run one delete; "not found" style errors just mean there's nothing to do.
async function attempt(fn) {
  try {
    await fn();
    removed += 1;
  } catch (e) {
    const code = e?.name ?? '';
    const status = e?.$metadata?.httpStatusCode;
    if (status === 404 || /NotFound|NoSuch|NonExistent|DoesNotExist|ValidationError/i.test(code)) return;
    throw e;
  }
}
const each = async (list, fn) => { for (const x of list ?? []) await attempt(() => fn(x)); };

if (spec.buckets) {
  const { S3Client, ListObjectsV2Command, DeleteObjectsCommand, DeleteBucketCommand } = sdk('s3');
  const s3 = new S3Client(config);
  await each(spec.buckets, async (Bucket) => {
    for (;;) {
      const page = await s3.send(new ListObjectsV2Command({ Bucket }));
      if (!page.Contents?.length) break;
      await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: page.Contents.map(({ Key }) => ({ Key })) } }));
    }
    await s3.send(new DeleteBucketCommand({ Bucket }));
  });
}

if (spec.volumeTags) {
  const { EC2Client, DescribeVolumesCommand, DeleteVolumeCommand } = sdk('ec2');
  const ec2 = new EC2Client(config);
  const { Volumes = [] } = await ec2.send(new DescribeVolumesCommand({
    Filters: [{ Name: 'tag:Name', Values: spec.volumeTags }],
  }));
  await each(Volumes, (v) => ec2.send(new DeleteVolumeCommand({ VolumeId: v.VolumeId })));
}

if (spec.functions) {
  const { LambdaClient, DeleteFunctionCommand } = sdk('lambda');
  const lambda = new LambdaClient(config);
  await each(spec.functions, (FunctionName) => lambda.send(new DeleteFunctionCommand({ FunctionName })));
}

if (spec.rules) {
  const { EventBridgeClient, ListTargetsByRuleCommand, RemoveTargetsCommand, DeleteRuleCommand } = sdk('eventbridge');
  const eb = new EventBridgeClient(config);
  await each(spec.rules, async (Rule) => {
    const { Targets = [] } = await eb.send(new ListTargetsByRuleCommand({ Rule }));
    if (Targets.length) await eb.send(new RemoveTargetsCommand({ Rule, Ids: Targets.map((t) => t.Id) }));
    await eb.send(new DeleteRuleCommand({ Name: Rule }));
  });
}

if (spec.topics) {
  const { SNSClient, ListTopicsCommand, DeleteTopicCommand } = sdk('sns');
  const sns = new SNSClient(config);
  const { Topics = [] } = await sns.send(new ListTopicsCommand({}));
  const doomed = Topics.filter((t) => spec.topics.includes(t.TopicArn.split(':').pop()));
  await each(doomed, (t) => sns.send(new DeleteTopicCommand({ TopicArn: t.TopicArn })));
}

if (spec.queues) {
  const { SQSClient, GetQueueUrlCommand, DeleteQueueCommand } = sdk('sqs');
  const sqs = new SQSClient(config);
  await each(spec.queues, async (QueueName) => {
    const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName }));
    await sqs.send(new DeleteQueueCommand({ QueueUrl }));
  });
}

if (spec.tables) {
  const { DynamoDBClient, DeleteTableCommand } = sdk('dynamodb');
  const ddb = new DynamoDBClient(config);
  await each(spec.tables, (TableName) => ddb.send(new DeleteTableCommand({ TableName })));
}

if (spec.restApis) {
  const { APIGatewayClient, GetRestApisCommand, DeleteRestApiCommand } = sdk('api-gateway');
  const apigw = new APIGatewayClient(config);
  const { items = [] } = await apigw.send(new GetRestApisCommand({ limit: 500 }));
  const doomed = items.filter((a) => spec.restApis.includes(a.name));
  await each(doomed, (a) => apigw.send(new DeleteRestApiCommand({ restApiId: a.id })));
}

if (spec.roles || spec.policies) {
  const iamSdk = sdk('iam');
  const iam = new iamSdk.IAMClient(config);
  await each(spec.roles, async (RoleName) => {
    const inline = await iam.send(new iamSdk.ListRolePoliciesCommand({ RoleName }));
    for (const PolicyName of inline.PolicyNames ?? []) {
      await iam.send(new iamSdk.DeleteRolePolicyCommand({ RoleName, PolicyName }));
    }
    const attached = await iam.send(new iamSdk.ListAttachedRolePoliciesCommand({ RoleName }));
    for (const { PolicyArn } of attached.AttachedPolicies ?? []) {
      await iam.send(new iamSdk.DetachRolePolicyCommand({ RoleName, PolicyArn }));
    }
    await iam.send(new iamSdk.DeleteRoleCommand({ RoleName }));
  });
  if (spec.policies) {
    const { Policies = [] } = await iam.send(new iamSdk.ListPoliciesCommand({ Scope: 'Local', MaxItems: 1000 }));
    const doomed = Policies.filter((p) => spec.policies.includes(p.PolicyName));
    await each(doomed, async ({ Arn: PolicyArn }) => {
      const { Versions = [] } = await iam.send(new iamSdk.ListPolicyVersionsCommand({ PolicyArn }));
      for (const v of Versions.filter((x) => !x.IsDefaultVersion)) {
        await iam.send(new iamSdk.DeletePolicyVersionCommand({ PolicyArn, VersionId: v.VersionId }));
      }
      await iam.send(new iamSdk.DeletePolicyCommand({ PolicyArn }));
    });
  }
}

if (spec.secrets) {
  const { SecretsManagerClient, DeleteSecretCommand } = sdk('secrets-manager');
  const sm = new SecretsManagerClient(config);
  await each(spec.secrets, (SecretId) =>
    sm.send(new DeleteSecretCommand({ SecretId, ForceDeleteWithoutRecovery: true })));
}

if (spec.parameters) {
  const { SSMClient, DeleteParameterCommand } = sdk('ssm');
  const ssm = new SSMClient(config);
  await each(spec.parameters, (Name) => ssm.send(new DeleteParameterCommand({ Name })));
}

if (spec.stacks) {
  const { CloudFormationClient, DeleteStackCommand, DescribeStacksCommand } = sdk('cloudformation');
  const cfn = new CloudFormationClient(config);
  await each(spec.stacks, async (StackName) => {
    await cfn.send(new DescribeStacksCommand({ StackName })); // throws if it doesn't exist
    await cfn.send(new DeleteStackCommand({ StackName }));
    for (let i = 0; i < 60; i++) {
      try {
        const { Stacks = [] } = await cfn.send(new DescribeStacksCommand({ StackName }));
        if (!Stacks.length || Stacks[0].StackStatus === 'DELETE_COMPLETE') break;
        if (Stacks[0].StackStatus === 'DELETE_FAILED') throw new Error(`stack ${StackName} failed to delete`);
      } catch (e) {
        if (/does not exist/i.test(e.message)) break;
        throw e;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  });
}

if (spec.logGroups) {
  const { CloudWatchLogsClient, DeleteLogGroupCommand } = sdk('cloudwatch-logs');
  const logs = new CloudWatchLogsClient(config);
  await each(spec.logGroups, (logGroupName) => logs.send(new DeleteLogGroupCommand({ logGroupName })));
}

if (spec.alarms) {
  const { CloudWatchClient, DeleteAlarmsCommand, DescribeAlarmsCommand } = sdk('cloudwatch');
  const cw = new CloudWatchClient(config);
  const { MetricAlarms = [] } = await cw.send(new DescribeAlarmsCommand({ AlarmNames: spec.alarms }));
  if (MetricAlarms.length) {
    await attempt(() => cw.send(new DeleteAlarmsCommand({ AlarmNames: MetricAlarms.map((a) => a.AlarmName) })));
  }
}

if (removed) console.log(`Cleared ${removed} leftover resource(s) from an earlier attempt.`);
process.exit(0);
