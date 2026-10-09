# 02 · GraphQL mutations

**Skills:** `mutation` operations, input types, variables, selecting fields
from a mutation's result, reading `errors`, batching with aliases.

## Background
Queries read. **Mutations** write. They look almost the same, and they return
data too, so you can ask for the updated object in the same round trip:

```graphql
mutation AddBook($input: AddBookInput!) {
  addBook(input: $input) {   # AddBookInput is an *input type*: a structured argument
    id                       # ask for whatever you need back
    title
  }
}
```
with variables `{ "input": { "title": "...", "year": 2000, "authorId": "1" } }`.

Things worth knowing:
- **Errors don't use HTTP status codes.** A GraphQL response is usually
  `200 OK` even when something failed. Check the `errors` array. Each error
  has a `message` and often `extensions.code` that a client can branch on.
- **Top-level mutation fields run in order**, one after another, unlike query
  fields, which may run in parallel. So several mutations in one document are
  predictable. Use aliases to tell their results apart.

## Scenario
The same library API as challenge 01. See `typeDefs` in `schema.js` for the
`Mutation` type and `AddBookInput`. Fill in the files in `mutations/`.

## Goal
1. `01-add-book.graphql` + `.variables.json`: add **"The Dispossessed"**
   (1974) by author `"1"`. Pass the whole input as a variable and return the
   new book's `id`, `title` and author's `name`.
2. `02-rate-book.graphql` + `.variables.json`: give book `"4"` a rating of
   `5`, with both arguments as variables. Return `id` and `rating`.
3. Run your rate-book mutation with a rating of `9`. Put the error's
   `extensions.code` in `03-error-code.txt`. (Then set the variable back to
   5.)
4. `04-cleanup.graphql`: in **one** mutation document, delete books `"6"`
   and `"7"` (a duplicate and a test record) with two aliased `deleteBook`
   fields.

## Try it
```bash
npm run query -- mutations/01-add-book.graphql mutations/01-add-book.variables.json
```
`npm run query` starts from fresh data every time. To see changes persist,
use `npm start` and send requests with curl, adding `"variables": {...}` next
to `"query"` in the JSON body.

## Check your work
```
./onboard validate graphql/02
```
