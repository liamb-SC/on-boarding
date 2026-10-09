// Run with: node api.mjs   — builds the REST API in front of hello-fn.
import {
  APIGatewayClient, GetRestApisCommand, DeleteRestApiCommand, CreateRestApiCommand, GetResourcesCommand,
  CreateResourceCommand, PutMethodCommand, PutIntegrationCommand, CreateDeploymentCommand,
} from '@aws-sdk/client-api-gateway';
import { LambdaClient, GetFunctionCommand, AddPermissionCommand } from '@aws-sdk/client-lambda';
import { ENDPOINT, REGION, arn, config } from './aws.mjs';

const apigw = new APIGatewayClient(config);
const lambda = new LambdaClient(config);
const name = 'hello-api';

// Start clean on every run: delete any earlier hello-api.
const { items = [] } = await apigw.send(new GetRestApisCommand({}));
for (const api of items.filter((a) => a.name === name)) {
  await apigw.send(new DeleteRestApiCommand({ restApiId: api.id }));
}

const fnArn = (await lambda.send(new GetFunctionCommand({ FunctionName: 'hello-fn' }))).Configuration.FunctionArn;

// 1. Create the REST API "hello-api". Find the id of its root resource ("/").
// 2. Under the root, create the resource "hello" (path /hello).
// 3. Add a GET method to it, with no authorization.
// 4. Integrate GET /hello with hello-fn as a Lambda *proxy* integration.
// 5. Allow API Gateway to invoke hello-fn (Lambda AddPermission).
// 6. Deploy the API to the stage "dev".
// 7. Print the URL to call. In LocalStack it is:
//    `${ENDPOINT}/restapis/${restApiId}/dev/_user_request_/hello`
