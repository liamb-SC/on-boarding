// Run with: node deploy-function.mjs   — creates or updates the hello-fn Lambda
// from function/. (This is challenge 03's deploy script, already done for you.)
import {
  LambdaClient, CreateFunctionCommand, UpdateFunctionCodeCommand, GetFunctionCommand,
  waitUntilFunctionActiveV2, waitUntilFunctionUpdatedV2,
} from '@aws-sdk/client-lambda';
import { config, lambdaRoleArn, zipDir } from './aws.mjs';

const lambda = new LambdaClient(config);
const FunctionName = 'hello-fn';
const ZipFile = zipDir('function');
const waitFor = { client: lambda, maxWaitTime: 120 };

let exists = true;
try {
  await lambda.send(new GetFunctionCommand({ FunctionName }));
} catch (e) {
  if (e.name !== 'ResourceNotFoundException') throw e;
  exists = false;
}
if (exists) {
  await lambda.send(new UpdateFunctionCodeCommand({ FunctionName, ZipFile }));
  await waitUntilFunctionUpdatedV2(waitFor, { FunctionName });
} else {
  await lambda.send(new CreateFunctionCommand({
    FunctionName, Runtime: 'nodejs22.x', Handler: 'index.handler', Role: await lambdaRoleArn(), Code: { ZipFile },
  }));
  await waitUntilFunctionActiveV2(waitFor, { FunctionName });
}
console.log(`${exists ? 'Updated' : 'Created'} ${FunctionName}`);
