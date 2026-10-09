// Run with: node store.mjs   (re-runnable)
// Puts the orders service's configuration where it belongs:
//   - secrets (things that grant access)  -> Secrets Manager
//   - settings (plain config)             -> SSM Parameter Store
import {
  SecretsManagerClient, CreateSecretCommand, PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';
import { randomBytes } from 'node:crypto';
import { config } from './aws.mjs';

const secrets = new SecretsManagerClient(config);
const ssm = new SSMClient(config);
const password = randomBytes(18).toString('base64url'); // 24 characters

// 1. A secret "orders/db" whose SecretString is JSON:
//    { "username": "orders_app", "password": <password> }
//    (CreateSecret the first time. If it exists, PutSecretValue a new version.)

// 2. Parameter "/orders/page-size" = "25", type String.

// 3. Parameter "/orders/api-key" = any value you like, type SecureString
//    (encrypted with KMS at rest).
