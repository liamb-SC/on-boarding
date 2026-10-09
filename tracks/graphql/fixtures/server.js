// A real GraphQL-over-HTTP server: npm start, then POST to /graphql, e.g.
//   curl -s localhost:4000/graphql -H 'content-type: application/json' \
//        -d '{"query":"{ books { title } }"}'
// Data lives in memory until you stop the server.
import { createServer } from 'node:http';
import { createHandler } from 'graphql-http/lib/use/http';
import { createSchema } from './schema.js';

const handler = createHandler({ schema: createSchema() });
const port = Number(process.env.PORT ?? 4000);

createServer((req, res) => {
  if (req.url.startsWith('/graphql')) return handler(req, res);
  res.writeHead(404).end();
}).listen(port, () => console.log(`GraphQL API on http://localhost:${port}/graphql`));
