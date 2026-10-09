# 08 · DynamoDB single-table design

**Skills:** partition and sort keys, item collections, `begins_with` on the
sort key, `ScanIndexForward`, GSIs, sparse indexes, designing keys from
access patterns.

## Background
DynamoDB has no joins and you shouldn't Scan, so you **design keys around
your queries**, not around your entities. Every item has:

- a **partition key (PK)**: which partition the item lives in. A Query must
  give an exact PK.
- a **sort key (SK)**: items sharing a PK are stored sorted by SK. A Query
  can narrow them with `begins_with(SK, 'ORDER#')` and read them in either
  direction (`ScanIndexForward: false` = descending).

In **single-table design**, different entity types share one table, and
related items share a PK, forming an *item collection* you can fetch in one
request:

| PK | SK | what |
|----|----|------|
| `CUSTOMER#c1` | `PROFILE` | the customer |
| `CUSTOMER#c1` | `ORDER#2024-03-17T14:20:00Z#o2` | one of their orders |

A **GSI** (global secondary index) re-keys the same items under a second
`GSI1PK`/`GSI1SK` pair, for a different access pattern. Only items that have
those attributes appear in it. That's a **sparse index**.

## Scenario
`data.js` has customers, orders and line items. `table.js` is an in-memory
stand-in for a DynamoDB table with one GSI. It supports only Query, like a
well-designed app. `keys.js` is where your design goes.

## Goal
In `keys.js`:
1. Give each entity its `PK` / `SK` (and `GSI1PK` / `GSI1SK` for orders only).
2. Make each access pattern a single query:
   1. `getCustomer`: just the profile item
   2. `ordersForCustomer`: newest first
   3. `lineItemsForOrder`
   4. `ordersByStatus`: across all customers, oldest first, through `GSI1`

`npm run try` loads the data and runs all four.

## Hints
- ISO-8601 timestamps sort correctly as strings. Put them in the sort key.
- Prefixes (`CUSTOMER#`, `ORDER#`, `ITEM#`) keep entity types apart in a
  collection, and make `skBeginsWith` useful.
- Line items fit naturally in their own collection: `PK = ORDER#<id>`.
- Bonus, with Docker: `docker run -p 8000:8000 amazon/dynamodb-local`, then
  create the table and run the same queries with the AWS CLI
  (`aws dynamodb query --endpoint-url http://localhost:8000 ...
  --key-condition-expression "PK = :pk AND begins_with(SK, :sk)"`).

## Check your work
```
./onboard validate data/08
```
