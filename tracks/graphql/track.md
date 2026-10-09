# Track: GraphQL

Consuming and building a GraphQL API in Node: writing queries and mutations
as a client, then designing the schema and resolvers as the server owner.

## Requirements
Node.js 20+ and network access to the npm registry. Each challenge's setup
installs `graphql`, `@graphql-tools/schema` and `graphql-http`.

## Learning objectives
By the end you can:
- Read a schema and write queries that fetch exactly what you need.
- Use arguments, nested fields, variables, aliases and fragments.
- Write mutations with input types and variables, and batch them with aliases.
- Read GraphQL errors (`errors[]`, `extensions.code`) instead of HTTP statuses.
- Add types, fields, queries and mutations to a schema, with careful nullability.
- Write field, query and mutation resolvers, and throw `GraphQLError`s with codes.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | queries | selection sets, arguments, nesting, variables, aliases, fragments |
| 02 | mutations | `mutation`, input types, variables, `errors[]`, aliased batches |
| 03 | schema-and-resolvers | SDL, nullability, resolvers, `GraphQLError` codes |

Every sandbox includes `npm run query -- <file.graphql> [vars.json]`, which
runs a document straight against the schema, and `npm start`, a real HTTP
server on `:4000/graphql`.

Start with: `./onboard start graphql/01`
