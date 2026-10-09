# 07 · IAM roles, least privilege, Secrets Manager and Parameter Store

**Skills:** roles vs trust policies vs permission policies, writing a
least-privilege policy, Secrets Manager, SSM Parameter Store (`String` and
`SecureString`), and reading config at runtime.

## Background
**IAM** decides who can do what. An **IAM role** is an identity that code
assumes, so no long-lived keys sit in your app. A role has two policies:

- the **trust policy**: *who* may assume the role (for a Lambda function, the
  service principal `lambda.amazonaws.com`);
- **permission policies**: *what* the role may do, as `Allow` statements of
  `Action` (e.g. `ssm:GetParameter`) on `Resource` (ARNs).

**Least privilege** means granting only the actions the code calls, on only
the resources it touches. `"Action": "*", "Resource": "*"` works, which is
exactly why it's dangerous: a bug or a leaked credential can then do anything.

Where config lives:
| | **Secrets Manager** | **SSM Parameter Store** |
|-|---------------------|-------------------------|
| For | Credentials: DB passwords, API tokens | Settings: feature flags, URLs, sizes, and some secrets |
| Extras | Versioning, built-in **rotation**, cross-account sharing | `String`, `StringList`, `SecureString` (KMS-encrypted). Hierarchies like `/orders/...`. The standard tier is free |

Secret ARNs end in a random suffix (`...:secret:orders/db-AbCdEf`), so policies
usually match them with `orders/db-*`.

LocalStack's free edition stores IAM policies but **doesn't enforce them**. The
validator reads your policy and evaluates it itself.

## Goal
1. Finish `store.mjs` and run it: the secret **`orders/db`** and the
   parameters **`/orders/page-size`** (`String`, `25`) and **`/orders/api-key`**
   (`SecureString`).
2. Write `trust-policy.json` (Lambda may assume the role) and replace the
   too-broad `policy.json` with a least-privilege one. It should allow
   **reading** the `orders/db` secret and the `/orders/*` parameters, and
   nothing else.
3. Finish `role.mjs` and run it: the role **`orders-config-reader`**, with your
   policy attached inline as **`read-orders-config`**.
4. Implement `loadConfig()` in `config.mjs`.

The validator checks the policy grants what `loadConfig` needs and denies, for
example, writing the secret, reading other secrets or parameters, and touching
other services.

## Hints
- ARN formats (account `000000000000`, region `us-east-1`):
  `arn:aws:secretsmanager:us-east-1:000000000000:secret:orders/db-*` and
  `arn:aws:ssm:us-east-1:000000000000:parameter/orders/*` (no slash after
  `parameter`).
- Keep one statement per service, and list actions exactly:
  `"secretsmanager:GetSecretValue"`, not `"secretsmanager:*"`.
- `GetParameterCommand({ Name, WithDecryption: true })` is needed to read a
  `SecureString` as plain text.
- `GetSecretValueCommand({ SecretId: 'orders/db' })` returns `SecretString`,
  which you `JSON.parse`.
- `PutParameterCommand({ Name, Value, Type, Overwrite: true })` makes re-runs
  safe.
- On real AWS you'd also see `kms:Decrypt` for SecureStrings encrypted with your
  own KMS key. The default `aws/ssm` key doesn't need it.

## Check your work
```
./onboard validate aws/07
```
