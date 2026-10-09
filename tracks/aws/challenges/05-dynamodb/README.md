# 05 · DynamoDB: put and query

**Skills:** partition and sort keys, on-demand tables, `PutItem`, `Query`
with a key condition, sort direction and `Limit`, the document client, and
why `Scan` is a smell.

## Background
DynamoDB is a key-value / document database. You don't design tables around
entities and joins. You design them around **how you'll read the data**.

- The **partition key** (`customerId`) decides which partition stores an item.
  Every read that's fast is a read on a known partition key.
- The **sort key** (`orderId`) orders the items inside a partition. Together
  they form the primary key, and must be unique.
- **`Query`** reads one partition, optionally narrowed by the sort key
  (`begins_with`, `between`, `>`), in sort-key order, either forwards or
  backwards. It's cheap and fast at any table size.
- **`Scan`** reads the *whole table* and filters afterwards. It's fine for a
  one-off script, but never use it on a request path.

Sort keys that start with a date (`2026-03-20#003`) sort chronologically, so
"latest orders" is a backwards Query with a `Limit`.

## Goal
1. Finish `table.mjs` and run it: table **`orders`** with partition key
   **`customerId`** and sort key **`orderId`** (both strings), on-demand
   billing.
2. Implement the three functions in `orders.mjs`:
   - `putOrder(order)` saves `{ customerId, orderId, total, status }`.
   - `ordersFor(customerId)` returns that customer's orders as plain objects,
     oldest first.
   - `latestOrders(customerId, limit)` returns the newest `limit` orders,
     newest first.
3. Try them with `node try.mjs`.

The validator calls your functions with its own customers and orders, and
reads the table directly to check what you stored.

## Hints
- `CreateTableCommand` needs `AttributeDefinitions` (name + type `S`/`N`/`B`,
  for key attributes only), `KeySchema` (`HASH` = partition, `RANGE` = sort)
  and `BillingMode`.
- `waitUntilTableExists({ client: ddb, maxWaitTime: 30 }, { TableName })`
- `new QueryCommand({ TableName, KeyConditionExpression: 'customerId = :c', ExpressionAttributeValues: { ':c': customerId } })`
  returns `{ Items }`.
- `ScanIndexForward: false` reverses the order. `Limit` caps how many items
  come back.
- Store `total` as a number, not a string. The document client does that if
  you pass a JS number.

## Check your work
```
./onboard validate aws/05
```
