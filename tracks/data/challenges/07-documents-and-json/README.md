# 07 · Flexible schemas: JSON columns and documents

**Skills:** JSON columns (`json_extract`, `json_each`), the document model
(embedding vs referencing), modelling the same data relationally and as a
document.

## Background
Relational tables want every row to have the same columns. Real data often
doesn't fit that: a shirt has sizes, a book has an ISBN. Two common ways out:

- **A JSON column** in a relational db: Postgres `JSONB`, MySQL `JSON`, SQLite's
  JSON functions. Keep the fixed fields as columns and the varying ones in a
  JSON document you can still query and index:
  `WHERE attrs->>'color' = 'red'` (Postgres) or
  `json_extract(attrs, '$.color') = 'red'` (SQLite).
- **A document database** (MongoDB, DynamoDB, Firestore). Each record *is* a
  JSON document. You model for how the data is **read**: things that are
  always read together are **embedded** in one document, so a single fetch
  needs no joins. Things that are shared, large, unbounded, or that change
  independently are **referenced** by id.

A document often stores a **snapshot**: the price you actually paid and the
address it shipped to, not whatever they are today.

## Scenario
`seed.js` builds a small shop db: `customers`, `products` (with a JSON `attrs`
column), `orders` and `order_items`. Explore it with
`npm run sql -- "SELECT * FROM products"`.

## Goal
1. `queries/01-red-shirts.sql`: `sku`, `name` of products in category `shirt`
   whose `attrs` colour is `red`, ordered by `name` then `sku`.
2. `queries/02-tag-counts.sql`: for every tag in `attrs.tags`, the columns
   `tag` and `n` (how many products have it), ordered `n` desc and then `tag`.
3. `order-1001.json`: order **1001** as a single MongoDB-style document, built
   from the relational data:
   `_id`, `status`, `placedAt`, `customer: { id, name }`,
   `items: [{ sku, name, qty, unitPrice }]` (the price *paid*) and `total`.
4. `answers.json`: should each thing be embedded in the order document, or
   referenced?

## Hints
- `npm run sql -- queries/01-red-shirts.sql` runs your file.
- `json_each(products.attrs, '$.tags')` turns the array into rows, with the
  element in a `value` column. Join it like a table:
  `FROM products, json_each(products.attrs, '$.tags') AS t`.
- Compare `order_items.unit_price` with `products.price`. They aren't always the same.

## Check your work
```
./onboard validate data/07
```
