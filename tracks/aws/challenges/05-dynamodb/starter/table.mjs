// Run with: node table.mjs   (re-runnable: skip creating if the table exists)
import {
  DynamoDBClient, CreateTableCommand, DescribeTableCommand, waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { config } from './aws.mjs';

const ddb = new DynamoDBClient(config);

// Create the table "orders":
//   - partition key customerId (string), sort key orderId (string)
//   - on-demand billing (PAY_PER_REQUEST)
// then wait until it exists. Print its KeySchema at the end.
