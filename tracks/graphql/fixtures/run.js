// Run a GraphQL document straight against the schema, no server needed:
//   npm run query -- queries/01-titles.graphql [queries/01-titles.variables.json]
// Each run starts from fresh data, so mutations don't stick between runs.
import { readFileSync } from 'node:fs';
import { graphql } from 'graphql';
import { createSchema } from './schema.js';

const [docPath, varsPath] = process.argv.slice(2);
if (!docPath) {
  console.error('usage: npm run query -- <file.graphql> [variables.json]');
  process.exit(1);
}
const result = await graphql({
  schema: createSchema(),
  source: readFileSync(docPath, 'utf8'),
  variableValues: varsPath ? JSON.parse(readFileSync(varsPath, 'utf8')) : undefined,
});
console.log(JSON.stringify(result, null, 2));
