// How the orders service loads its configuration at startup. The validator
// changes the stored values, then calls loadConfig() to check it reads them live.
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { config } from './aws.mjs';

const secrets = new SecretsManagerClient(config);
const ssm = new SSMClient(config);

// Return { dbUser, dbPassword, pageSize, apiKey }:
//   dbUser, dbPassword  from the orders/db secret
//   pageSize            from /orders/page-size, as a number
//   apiKey              from /orders/api-key, decrypted
export async function loadConfig() {
  // TODO
}
