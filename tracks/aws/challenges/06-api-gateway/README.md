# 06 · API Gateway → Lambda

**Skills:** REST APIs, resources and methods, Lambda proxy integrations,
the proxy event and response format, resource-based permissions, deployments
and stages.

## Background
A Lambda function has no URL of its own. **API Gateway** gives it one. A REST
API is a tree of **resources** (`/`, `/hello`, `/orders/{id}`), and each
resource has **methods** (`GET`, `POST`...). Each method has an
**integration** that says what handles the request.

With a **Lambda proxy integration** (`AWS_PROXY`), API Gateway passes the whole
request to the function as the event, and turns the function's
`{ statusCode, headers, body }` into the HTTP response. `body` must be a
**string**, so `JSON.stringify` it.

Two things trip everyone up:
- **Permissions run both ways.** API Gateway needs permission to call the
  function: a statement on the *function's* resource policy (Lambda
  `AddPermission`) for the principal `apigateway.amazonaws.com`.
- **Nothing is live until you deploy.** A **deployment** snapshots the API, and
  a **stage** (`dev`, `prod`) is the named, URL-addressable place it's deployed
  to.

Integration URIs look like
`arn:aws:apigateway:<region>:lambda:path/2015-03-31/functions/<function ARN>/invocations`.

## Goal
1. Write the handler in `function/index.mjs` (the comments give the exact
   responses), then deploy it: `node deploy-function.mjs`.
2. Finish `api.mjs` and run it. It should create the REST API **`hello-api`**
   with **`GET /hello`** proxied to **`hello-fn`**, give API Gateway permission
   to invoke the function, deploy to stage **`dev`** and print the URL.
3. Call it:
   ```bash
   curl -i "http://localhost:4566/restapis/<id>/dev/_user_request_/hello?name=Ada"
   curl -i "http://localhost:4566/restapis/<id>/dev/_user_request_/hello"
   ```

## Hints
- `CreateRestApiCommand({ name })` returns `{ id }`. `GetResourcesCommand({ restApiId })`
  lists resources. The root is the one whose `path` is `/`.
- `CreateResourceCommand({ restApiId, parentId, pathPart: 'hello' })`
- `PutMethodCommand({ restApiId, resourceId, httpMethod: 'GET', authorizationType: 'NONE' })`
- `PutIntegrationCommand({ restApiId, resourceId, httpMethod: 'GET', type: 'AWS_PROXY', integrationHttpMethod: 'POST', uri })`.
  Lambda is always invoked with **POST**, whatever the client's method.
- ``AddPermissionCommand({ FunctionName, StatementId, Action: 'lambda:InvokeFunction', Principal: 'apigateway.amazonaws.com', SourceArn: arn('execute-api', `${restApiId}/*/GET/hello`) })``.
  Each run of `api.mjs` makes a new API with a new id, so put the id in the
  `StatementId` (e.g. `` `apigw-${restApiId}` ``). Reusing one throws
  `ResourceConflictException`.
- `CreateDeploymentCommand({ restApiId, stageName: 'dev' })`
- On real AWS the URL is `https://<id>.execute-api.<region>.amazonaws.com/dev/hello`.

## Check your work
```
./onboard validate aws/06
```
