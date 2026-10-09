// Run with: node deploy.mjs [dev|prod]   — creates or updates the stack
// "onboard-app" from template.yaml, waits, and prints the outputs.
import { readFileSync } from 'node:fs';
import {
  CloudFormationClient, CreateStackCommand, UpdateStackCommand, DescribeStacksCommand,
  DescribeStackEventsCommand, DeleteStackCommand, waitUntilStackCreateComplete,
  waitUntilStackUpdateComplete, waitUntilStackDeleteComplete,
} from '@aws-sdk/client-cloudformation';
import { config } from './aws.mjs';

const cfn = new CloudFormationClient(config);
const StackName = 'onboard-app';
const input = {
  StackName,
  TemplateBody: readFileSync('template.yaml', 'utf8'),
  Parameters: [{ ParameterKey: 'Env', ParameterValue: process.argv[2] ?? 'dev' }],
};

const status = await cfn.send(new DescribeStacksCommand({ StackName }))
  .then(({ Stacks }) => Stacks[0]?.StackStatus, () => undefined);
const waitFor = { client: cfn, maxWaitTime: 180 };

// A stack whose first create failed (ROLLBACK_COMPLETE) can't be updated, only deleted.
if (status === 'ROLLBACK_COMPLETE') {
  console.log(`${StackName} failed to create last time; deleting it first...`);
  await cfn.send(new DeleteStackCommand({ StackName }));
  await waitUntilStackDeleteComplete(waitFor, { StackName });
}
const exists = status && !['DELETE_COMPLETE', 'ROLLBACK_COMPLETE'].includes(status);

try {
  if (exists) {
    console.log(`Updating ${StackName}...`);
    await cfn.send(new UpdateStackCommand(input));
    await waitUntilStackUpdateComplete(waitFor, { StackName });
  } else {
    console.log(`Creating ${StackName}...`);
    await cfn.send(new CreateStackCommand(input));
    await waitUntilStackCreateComplete(waitFor, { StackName });
  }
} catch (e) {
  if (/No updates are to be performed/.test(e.message)) {
    console.log('No changes.');
  } else {
    // Show *why*: the failed resources' status reasons.
    console.error(`✗ ${e.message ?? e.name}`);
    const { StackEvents = [] } = await cfn.send(new DescribeStackEventsCommand({ StackName })).catch(() => ({}));
    for (const ev of StackEvents.filter((x) => /FAILED/.test(x.ResourceStatus)).slice(0, 5)) {
      console.error(`  ${ev.LogicalResourceId} ${ev.ResourceStatus}: ${ev.ResourceStatusReason}`);
    }
    process.exit(1);
  }
}

const [stack] = (await cfn.send(new DescribeStacksCommand({ StackName }))).Stacks;
console.log(`${StackName}: ${stack.StackStatus}`);
for (const o of stack.Outputs ?? []) console.log(`  ${o.OutputKey} = ${o.OutputValue}`);
