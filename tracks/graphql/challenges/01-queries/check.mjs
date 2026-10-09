import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, stage, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const fixtures = stage(path.resolve(fileURLToPath(import.meta.url), '../../../fixtures'), 'graphql');
const { graphql, parse, Kind, visit } = await fromSandbox('graphql');
const { createSchema } = await fromSandbox(`${fixtures}/schema.js`);

const read = (f) => readFileSync(path.join(SANDBOX, 'queries', f), 'utf8');
const readJson = (f) => JSON.parse(read(f));

// Run the learner's document and a reference one; the data must match exactly —
// same fields, same aliases, nothing extra (no over-fetching).
async function sameAs(file, reference, vars, refVars = vars) {
  const source = read(file);
  const doc = parse(source); // throws a readable syntax error
  const got = await graphql({ schema: createSchema(), source, variableValues: vars });
  expect(!got.errors, `the query returned errors: ${got.errors?.map((e) => e.message).join('; ')}`);
  const want = await graphql({ schema: createSchema(), source: reference, variableValues: refVars });
  expectEqual(got.data, want.data);
  return doc;
}

const argKinds = (doc, field, arg) => {
  const kinds = [];
  visit(doc, {
    Field(node) {
      if (node.name.value !== field) return;
      for (const a of node.arguments) if (a.name.value === arg) kinds.push(a.value.kind);
    },
  });
  return kinds;
};

await check('01: lists every book\'s title (and nothing else)', () =>
  sameAs('01-titles.graphql', '{ books { title } }'));

await check('02: book "3" with its title, year and author\'s name', () =>
  sameAs('02-book-with-author.graphql', '{ book(id: "3") { title year author { name } } }'));

await check('03: author "2" with name and book titles, using a $id variable', async () => {
  const vars = readJson('03-author-books.variables.json');
  expectEqual(vars, { id: '2' }, 'variables file: ');
  const doc = await sameAs('03-author-books.graphql',
    'query ($id: ID!) { author(id: $id) { name books { title } } }', vars);
  const op = doc.definitions.find((d) => d.kind === Kind.OPERATION_DEFINITION);
  expect(op.variableDefinitions.length > 0, 'the operation declares no variables — add ($id: ID!)');
  expect(argKinds(doc, 'author', 'id').every((k) => k === Kind.VARIABLE),
    'author(id: ...) must use the variable ($id), not a hard-coded value');
});

await check('03: the query works for ANY author, not just "2" (it really uses the variable)', async () => {
  const source = read('03-author-books.graphql');
  const got = await graphql({ schema: createSchema(), source, variableValues: { id: '3' } });
  expect(got.data?.author?.name === 'Octavia E. Butler', 'with { "id": "3" } it did not return Octavia E. Butler');
});

await check('04: books "1" and "2" side by side as `first` and `second` (title + rating)', () =>
  sameAs('04-compare.graphql',
    '{ first: book(id: "1") { title rating } second: book(id: "2") { title rating } }'));

await check('04: the shared fields come from a fragment on Book', () => {
  const doc = parse(read('04-compare.graphql'));
  const frags = doc.definitions.filter((d) => d.kind === Kind.FRAGMENT_DEFINITION);
  expect(frags.some((f) => f.typeCondition.name.value === 'Book'), 'no `fragment ... on Book` found');
  let spreads = 0;
  visit(doc, { FragmentSpread() { spreads += 1; } });
  expect(spreads >= 2, 'spread the fragment (...Name) into both books');
});
