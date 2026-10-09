import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { listen, request } from '../../http-checks.mjs';

watchdog();
const { default: SwaggerParser } = await fromSandbox('@apidevtools/swagger-parser');
const raw = () => JSON.parse(readFileSync(path.join(SANDBOX, 'openapi.json'), 'utf8'));

let spec; // dereferenced: every $ref replaced by what it points to
await check('openapi.json is a valid OpenAPI 3 document (npm run lint:spec)', async () => {
  spec = await SwaggerParser.validate(raw());
  expect(String(spec.openapi).startsWith('3.'), `openapi is ${spec.openapi}, expected 3.x`);
});
if (!spec) process.exit(1);

const { createApp } = await fromSandbox('./app.js');
const app = createApp();
const api = await listen(app);
const call = (p, o) => request(api.url + p, o);

// What the code really serves: Express 4 keeps routes on app._router.stack.
// Express's "/books/:id" is OpenAPI's "/books/{id}".
const SERVED_BY_TOOLING = new Set(['/openapi.json']);
const routes = new Set();
for (const layer of app._router?.stack ?? []) {
  if (!layer.route || SERVED_BY_TOOLING.has(layer.route.path)) continue;
  for (const m of Object.keys(layer.route.methods)) {
    routes.add(`${m.toUpperCase()} ${layer.route.path.replace(/:(\w+)/g, '{$1}')}`);
  }
}
const documented = new Set();
for (const [p, item] of Object.entries(spec.paths ?? {})) {
  for (const m of ['get', 'post', 'put', 'patch', 'delete']) if (item[m]) documented.add(`${m.toUpperCase()} ${p}`);
}
const op = (method, p) => spec.paths?.[p]?.[method];

await check('every route in app.js is documented in the spec', () => {
  const missing = [...routes].filter((r) => !documented.has(r));
  expect(!missing.length, `undocumented: ${missing.join(', ')}`);
});
await check('the spec documents no routes that don\'t exist', () => {
  const extra = [...documented].filter((r) => !routes.has(r));
  expect(!extra.length, `not in the code: ${extra.join(', ')}`);
});
await check('{id} is a required, integer path parameter wherever it appears', () => {
  const withId = [...documented].filter((r) => r.includes('{id}'));
  expect(withId.length, 'no /books/{id} operations documented yet');
  for (const r of withId) {
    const [m, p] = r.split(' ');
    const params = [...(spec.paths[p].parameters ?? []), ...(op(m.toLowerCase(), p).parameters ?? [])];
    const id = params.find((x) => x.name === 'id' && x.in === 'path');
    expect(id?.required === true, `${r}: no required path parameter "id"`);
    expect(id.schema?.type === 'integer', `${r}: id should be { "type": "integer" }`);
  }
});
await check('POST /books has a JSON requestBody whose schema requires title and author', () => {
  const schema = op('post', '/books')?.requestBody?.content?.['application/json']?.schema;
  expect(schema, 'no requestBody.content["application/json"].schema');
  const req = schema.required ?? [];
  expect(req.includes('title') && req.includes('author'), `required is ${JSON.stringify(req)}`);
});
await check('the Book schema describes every field the API really returns', async () => {
  const { body } = await call('/books/1');
  const props = spec.components?.schemas?.Book?.properties ?? {};
  const missing = Object.keys(body).filter((k) => !(k in props));
  expect(!missing.length, `Book.properties is missing: ${missing.join(', ')}`);
});

// Hit the real API and make sure each status code it answers with is in the spec.
const probes = [
  ['GET /books 200', 'get', '/books', () => call('/books')],
  ['GET /books/{id} 200', 'get', '/books/{id}', () => call('/books/1')],
  ['GET /books/{id} 404', 'get', '/books/{id}', () => call('/books/999')],
  ['POST /books 201', 'post', '/books', () => call('/books', { method: 'POST', json: { title: 'Emma', author: 'Jane Austen' } })],
  ['POST /books 400', 'post', '/books', () => call('/books', { method: 'POST', json: { title: 'Emma' } })],
  ['DELETE /books/{id} 204', 'delete', '/books/{id}', () => call('/books/2', { method: 'DELETE' })],
  ['DELETE /books/{id} 404', 'delete', '/books/{id}', () => call('/books/999', { method: 'DELETE' })],
];
await check('every status code the API actually returns is documented', async () => {
  const missing = [];
  for (const [label, m, p, run] of probes) {
    const { status } = await run();
    expectEqual(String(status), label.split(' ').pop(), `${label.split(' ').slice(0, 2).join(' ')} returned: `);
    if (!op(m, p)?.responses?.[status]) missing.push(label);
  }
  expect(!missing.length, `responses missing from the spec: ${missing.join(', ')}`);
});

await check('GET /openapi.json serves the spec', async () => {
  const r = await call('/openapi.json');
  expectEqual(r.status, 200, 'status: ');
  expectEqual(r.body, raw(), 'body: ');
});
await check('GET /docs/ serves Swagger UI', async () => {
  const r = await call('/docs/');
  expectEqual(r.status, 200, 'status: ');
  expect(/swagger-ui/i.test(r.text), 'the page doesn\'t look like Swagger UI');
});
await api.close();
