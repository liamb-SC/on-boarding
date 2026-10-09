# 03 · Lambda (and Google Cloud Functions)

**Skills:** writing a Node handler, packaging it as a zip, `CreateFunction`
vs `UpdateFunctionCode`, waiting for a function to be ready, `Invoke` and
`FunctionError`, and how Lambda compares with Google Cloud Functions.

## Background
A Lambda **function** is your code plus config: a runtime (`nodejs22.x`), a
**handler** (`index.handler` means "file `index`, export `handler`"), memory, a
timeout (max 15 min) and an **execution role**, the IAM role the code runs as.
Lambda starts an **execution environment** when a request arrives (a **cold
start**), reuses it for later requests, and scales out by running more of them
side by side.

A handler gets an `event` (the payload, or a description of what happened,
e.g. "this S3 object was created") and returns a result. If it throws, the
caller gets the error and `FunctionError` is set on the response.

When you deploy, Lambda creates the function asynchronously: it's `Pending`
before it's `Active`. Updates go through `InProgress` before `Successful`.
Scripts that deploy and then invoke must **wait** in between.

LocalStack runs each function in its own Docker container. The first invoke
pulls the Node runtime image, so it can take a minute.

## Goal
1. Write the handler in `function/index.mjs`. The comments say what it
   does.
2. Finish `deploy.mjs` so it creates **`order-total`** (runtime
   `nodejs22.x`, handler `index.handler`), or updates its code if it already
   exists. Run it.
3. Finish `invoke.mjs` and try it:
   `node invoke.mjs '{"items":[{"sku":"A","qty":2,"price":8.5}]}'`
   should print `{"count":2,"total":17}`. Also try `node invoke.mjs '{}'`.
4. Answer the questions below in `gcf.json` with `a`, `b` or `c`.

The validator invokes your deployed function with its own random orders.

### Lambda vs Google Cloud Functions
Google's equivalent is **Cloud Functions**, now branded **Cloud Run
functions**. Same idea: upload a function and pay per use. The details differ.

| Key | Question | a | b | c |
|-----|----------|---|---|---|
| `handler-signature` | A Node **HTTP** Cloud Function looks like... | `export const handler = async (event, context) => ({ statusCode: 200, body })` | `exports.main = (args) => ({ body })` | `functions.http('hello', (req, res) => res.send('hi'))`, Express-style |
| `concurrency` | How many requests can one instance handle at once? | Both: exactly one | Standard Lambda: one per execution environment. Cloud Functions (2nd gen): configurable, up to 1000 | Both: unlimited |
| `max-http-timeout` | Longest an HTTP-triggered run can take? | Lambda 15 min. Cloud Functions 2nd gen up to 60 min | Both 15 min | Lambda 60 min. Cloud Functions 9 min |
| `event-triggers` | Google's version of "an S3 upload / EventBridge rule invokes a Lambda"? | There isn't one, you poll | Cloud Scheduler | Eventarc triggers delivering CloudEvents (e.g. from Cloud Storage or Pub/Sub) |
| `built-on` | Cloud Functions 2nd gen runs on... | Cloud Run | App Engine | Compute Engine VMs you manage |
| `cold-starts` | Which pair of settings keeps warm instances ready to cut cold starts? | Bigger memory on both | Lambda provisioned concurrency / Cloud Functions minimum instances | Shorter timeouts on both |

## Hints
- `new CreateFunctionCommand({ FunctionName, Runtime, Handler, Role, Code: { ZipFile } })`
- `await waitUntilFunctionActiveV2({ client: lambda, maxWaitTime: 120 }, { FunctionName })`,
  and similarly `waitUntilFunctionUpdatedV2` after an update.
- `new InvokeCommand({ FunctionName, Payload: payload })` (a JSON string works).
- Rounding to 2 dp: `Math.round(x * 100) / 100`.
- Logs: everything a function `console.log`s goes to CloudWatch Logs, in the
  log group `/aws/lambda/order-total`. `./localstack.sh logs` shows LocalStack's
  side.

## Check your work
```
./onboard validate aws/03
```
