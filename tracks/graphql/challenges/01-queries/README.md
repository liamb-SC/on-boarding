# 01 · GraphQL queries

**Skills:** selection sets, arguments, nested fields, variables, aliases,
fragments, and asking for only what you need.

## Background
A GraphQL API exposes a **schema** (a typed description of everything you can
ask for) at a single endpoint. The client sends a **query** that says exactly
which fields it wants, and the response has exactly that shape. No more, no
less.

```graphql
query {
  book(id: "1") {      # a field with an argument
    title              # pick the fields you need...
    author { name }    # ...and follow relationships in one request
  }
}
```

- **Variables** keep values out of the query text:
  `query ($id: ID!) { book(id: $id) { title } }` with `{ "id": "1" }` sent
  alongside. Always use them for real input. Queries become reusable and
  cacheable, and you avoid injection bugs from string-building.
- **Aliases** rename a field in the response, so you can ask for the same field
  twice: `a: book(id: "1") { title }  b: book(id: "2") { title }`.
- **Fragments** are named, reusable sets of fields:
  `fragment Summary on Book { title rating }`, used with `...Summary`.

## Scenario
A library API. Open `schema.js` and read `typeDefs` to see the types. Then
fill in the four files in `queries/`.

## Goal
1. `01-titles.graphql`: the title of every book. Only titles.
2. `02-book-with-author.graphql`: book `"3"`: its `title`, `year` and its
   author's `name`.
3. `03-author-books.graphql` + `03-author-books.variables.json`: an author
   chosen by a **`$id` variable** (set it to `"2"`), with their `name` and the
   `title` of each of their books.
4. `04-compare.graphql`: books `"1"` and `"2"` in one request, aliased
   `first` and `second`. Get each one's `title` and `rating` from a **fragment
   on `Book`**.

The validator compares your response with the expected one exactly, so extra
fields fail. Asking only for what you need is the point of GraphQL.

## Try it
```bash
npm run query -- queries/01-titles.graphql
npm run query -- queries/03-author-books.graphql queries/03-author-books.variables.json

# or over HTTP, like a real client:
npm start        # in another terminal
curl -s localhost:4000/graphql -H 'content-type: application/json' \
     -d '{"query":"{ books { title } }"}'
```

## Hints
- Every `Book` has an `author`, and every `Author` has `books`. You can nest as
  deep as you like.
- A variable is declared on the operation (`query GetAuthor($id: ID!)`) and
  used as `$id`. Its type must match the argument's type in the schema.

## Check your work
```
./onboard validate graphql/01
```
