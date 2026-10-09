# Track: AWS

The AWS services we build on, practised against **LocalStack**, a local AWS
emulator running in Docker. No AWS account and no bill. You drive everything
from small Node scripts with the **AWS SDK for JavaScript v3**, the same code
you'd write against real AWS. The validators query LocalStack to see what
really exists and how it behaves.

## Requirements
- **Docker** (Desktop, or the engine on Linux) with its daemon running. Not
  needed for 01.
- Node.js 20+ and network access to the npm registry. Each challenge's setup
  installs only the SDK clients it uses.

Setup starts LocalStack for you. Each sandbox also has `./localstack.sh`:

```bash
./localstack.sh status    # is it up? which services?
./localstack.sh start     # start or reuse the container and wait until healthy
./localstack.sh logs      # what LocalStack is doing (Lambda errors show up here)
./localstack.sh restart   # wipe every resource and start fresh
./localstack.sh stop      # remove the container
```

It runs the image `localstack/localstack:4.14`, the last free community
release. Newer LocalStack images need an account and an auth token. If you
have one, set `LOCALSTACK_IMAGE` and `LOCALSTACK_AUTH_TOKEN`. One container
(`onboard-localstack`, port 4566) serves every challenge, and its state lasts
until it stops. Every sandbox has an `aws.mjs` that points the SDK at it:

```js
import { S3Client } from '@aws-sdk/client-s3';
import { config } from './aws.mjs';
const s3 = new S3Client(config); // endpoint localhost:4566, region us-east-1, fake creds
```

The free edition has no EFS or X-Ray, and it doesn't enforce IAM. Those topics
are taught with scenario questions, a real trace to read, and a validator that
evaluates your policy itself.

## Learning objectives
By the end you can:
- Place the core services in compute / storage / database / networking and
  pick the right one for a job.
- Use S3 buckets, objects, prefixes and presigned URLs, and choose between
  S3, EBS and EFS.
- Package, deploy, update and invoke a Node Lambda, and compare it with Google
  Cloud Functions.
- Fan out with SNS → SQS and route events with EventBridge rules, including
  the queue policies real AWS requires.
- Model a DynamoDB table around its access pattern, then put and query items.
- Put API Gateway in front of a Lambda with a proxy integration.
- Write an IAM role with a least-privilege policy, and keep config in Secrets
  Manager and Parameter Store.
- Declare a stack in CloudFormation with parameters, references and outputs.
- Log, measure and alarm with CloudWatch, and read an X-Ray trace.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | cloud-map | compute / storage / database / networking, EC2 vs Lambda vs ECS, RDS vs DynamoDB, VPC, subnets, security groups, CloudFront (no Docker) |
| 02 | storage | S3 buckets, objects, prefixes, presigned URLs, an EBS volume, S3 vs EBS vs EFS |
| 03 | lambda | handlers, zip packaging, create/update/wait, invoke, `FunctionError`, Lambda vs Google Cloud Functions |
| 04 | messaging | SQS, SNS fan-out, raw delivery, EventBridge rules and patterns, queue policies |
| 05 | dynamodb | partition/sort keys, on-demand, `PutItem`, `Query`, sort order, `Limit`, Query vs Scan |
| 06 | api-gateway | REST API resources and methods, `AWS_PROXY`, Lambda permissions, deployments and stages |
| 07 | iam-and-secrets | roles, trust vs permission policies, least privilege, Secrets Manager, SSM `SecureString` |
| 08 | cloudformation | templates, parameters, `!Ref`/`!GetAtt`/`!Sub`, outputs, stack create/update/rollback |
| 09 | observability | CloudWatch Logs, retention, metrics and dimensions, alarms, X-Ray segments and faults |

Start with: `./onboard start aws/01`
