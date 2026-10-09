# 03 · Build it: schema and resolvers

**Skills:** schema design (types, input types, nullability), field resolvers,
query and mutation resolvers, `GraphQLError` with error codes.

## Background
A GraphQL server has two parts:

- **Type definitions**: the schema in GraphQL SDL. `!` means *non-null*.
  `[Book!]!` is "a list that's never null, of books that are never null".
  Think about nullability carefully, because clients rely on it.
- **Resolvers**: one function per field that needs computing, with the
  signature `(parent, args, context, info)`. `parent` is the object the field
  belongs to, so `Author.books` gets the author and returns its books. Fields
  without a resolver return the property of the same name.

Resolvers can **throw a `GraphQLError`** with `extensions.code`. The error
ends up in the response's `errors` array, where clients branch on the code.

## Scenario
You own the library API now. Everything is in `schema.js`: `typeDefs` at the
top, and the resolvers in `createSchema()`. The data lives in `db`, created
from `data.js` (look at `db.reviews`).

## Goal
1. **Computed field**: add `bookCount: Int!` to `Author`.
2. **Query with an argument**: add `searchBooks(term: String!): [Book!]!`,
   a case-insensitive title search.
3. **Reviews**, a new type with a mutation:
   ```graphql
   type Review { id: ID!  stars: Int!  comment: String  book: Book! }
   input AddReviewInput { bookId: ID!  stars: Int!  comment: String }
   ```
   - `Book.reviews: [Review!]!` returns that book's reviews.
   - `Mutation.addReview(input: AddReviewInput!): Review!` saves a review
     with ids `"1"`, `"2"`, … in order. Store `bookId` on the review and
     resolve `Review.book` from it, the same way `Book.author` works.
   - `stars` outside 1–5 throws a `GraphQLError` with code
     `BAD_USER_INPUT`. An unknown `bookId` throws `NOT_FOUND`. Neither
     saves anything.

Keep `createSchema()` exported. The validator builds a fresh schema from it
for each check.

## Try it
Write little queries in a scratch `.graphql` file and run them with
`npm run query -- scratch.graphql`, or `npm start` and use curl.

## Hints
- `addBook` and `rateBook` already show how to validate input and throw
  errors, and `nextId` makes ids.
- A resolver for `Author.bookCount` gets the author as its first argument.

## Check your work
```
./onboard validate graphql/03
```
