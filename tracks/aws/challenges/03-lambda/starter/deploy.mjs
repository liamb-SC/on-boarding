// Run with: node deploy.mjs   (run it again after every change to function/)
import {
  LambdaClient, CreateFunctionCommand, UpdateFunctionCodeCommand, GetFunctionCommand,
  waitUntilFunctionActiveV2, waitUntilFunctionUpdatedV2,
} from '@aws-sdk/client-lambda';
import { config, lambdaRoleArn, zipDir } from './aws.mjs';

const lambda = new LambdaClient(config);
const FunctionName = 'order-total';
const ZipFile = zipDir('function'); // function/ as a .zip, in memory

// If the function doesn't exist yet (GetFunction throws ResourceNotFoundException):
//   create it: runtime nodejs22.x, handler "index.handler" (file index.mjs, export
//   "handler"), Role: await lambdaRoleArn(), Code: { ZipFile }, and then wait
//   until it's Active.
// Otherwise: upload the new code with UpdateFunctionCode, then wait until the
//   update has finished.
