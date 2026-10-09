# Beacon: system overview

*Written by Tom Okafor after go-live (2026-11-18). Beacon is in production.*

Beacon sends Brightwell's delivery texts ("shipped", "out for delivery",
"delivered"). It is part of the **notifications** system and is owned by
**team-beacon** (tech lead Tom Okafor, product owner Priya Shah). Chat:
**#team-beacon** on Slack.

## How it works
1. **order-service** (owned by team-orders) publishes a shipping event to the
   SQS queue **beacon-queue** whenever a parcel is scanned.
2. **beacon-worker** reads the queue, looks up the customer's phone number
   from **customer-profile-api** (owned by team-crm), and sends the text
   through the **TextBridge** REST API.
3. Every text is recorded in **beacon-db**, an Amazon RDS for PostgreSQL 16
   database. History is kept for 90 days.
4. Messages that fail three times land in the dead-letter queue
   **beacon-dlq**.
5. **beacon-api** is a small REST service that lets internal tools (the
   customer-support console) look up the texts sent for an order and resend
   one. Its contract is the **Beacon Messages API** (OpenAPI spec at
   `api/openapi.yaml`, base path `/v2/messages`).

Both `beacon-api` and `beacon-worker` are Node.js 20 services that run as
containers on **ECS Fargate**. Images live in **ECR**. They're in one repo:
`github.com/brightwell/beacon`.

## Security
- Internal callers authenticate to beacon-api with **OAuth 2.0 client
  credentials** issued by Brightwell's **Okta**. They send a JWT bearer token.
- beacon-worker authenticates to TextBridge with an **API key** stored in **AWS
  Secrets Manager** as `beacon/textbridge-api-key`, rotated every 90 days.
  (The dev key for local testing is `tb_test_7Hq2xV9pLm4R`. Don't let it
  leak anywhere else.)

## Delivery and infrastructure
- CI/CD is **GitHub Actions**: on merge to `main` it runs the tests, builds the
  image, pushes it to ECR and deploys to ECS with a rolling update.
- Infrastructure is **Terraform**, in the `brightwell/platform-infra` repo
  under `modules/beacon`. Everything runs in AWS **eu-west-2** (London).

## Observability
- Metrics, traces and the "Beacon overview" dashboard are in **Datadog**.
  Logs go to **CloudWatch Logs**, and from there to Datadog.
- Alerts page the team-beacon on-call through **PagerDuty**:
  - beacon-dlq has any messages (depth > 0)
  - TextBridge error rate above 2% for 5 minutes
  - oldest message on beacon-queue older than 5 minutes

## Legacy
**SMSPort**, the old SMS gateway, is still connected as a fallback until its
contract ends on 2026-12-31.
