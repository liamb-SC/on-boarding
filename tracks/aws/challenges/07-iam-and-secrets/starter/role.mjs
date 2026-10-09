// Run with: node role.mjs   (re-runnable)
import { readFileSync } from 'node:fs';
import {
  IAMClient, GetRoleCommand, CreateRoleCommand, UpdateAssumeRolePolicyCommand, PutRolePolicyCommand,
} from '@aws-sdk/client-iam';
import { config } from './aws.mjs';

const iam = new IAMClient(config);
const RoleName = 'orders-config-reader';
const trust = readFileSync('trust-policy.json', 'utf8');
const permissions = readFileSync('policy.json', 'utf8');

// 1. Create the role with trust-policy.json as its AssumeRolePolicyDocument.
//    If it already exists, update its trust policy instead.
// 2. Put policy.json on it as an inline policy named "read-orders-config".
//    (PutRolePolicy overwrites, so re-running is fine.)
