// Data access for the "orders" table. The validator imports these functions
// and calls them with its own data.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { config } from './aws.mjs';

// The document client converts plain JS objects to and from DynamoDB's typed
// attributes ({ S: 'x' }, { N: '42' }) for you.
const db = DynamoDBDocumentClient.from(new DynamoDBClient(config));
const TableName = 'orders';

// Save an order: { customerId, orderId, total, status }.
export async function putOrder(order) {
  // TODO
}

// All of one customer's orders, oldest first (by orderId).
export async function ordersFor(customerId) {
  // TODO: a Query on the partition key, not a Scan
}

// The `limit` most recent orders for one customer, newest first.
export async function latestOrders(customerId, limit) {
  // TODO: same Query, read backwards, stop after `limit`
}
