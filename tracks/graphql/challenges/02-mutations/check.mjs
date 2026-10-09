import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, stage, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const fixtures = stage(path.resolve(fileURLToPath(import.meta.url), '../../../fixtures'), 'graphql');
const { graphql, parse, Kind, visit } = await fromSandbox('graphql');
const { createSchema } = await fromSandbox(`${fixtures}/schema.js`);

const read = (f) => readFileSync(path.join(SANDBOX, 'mutations', f), 'utf8');
const readJson = (f) => JSON.parse(read(f));

async function run(schema, source, variableValues) {
  const res = await graphql({ schema, source, variableValues });
  expect(!res.errors, `the server returned errors: ${res.errors?.map((e) => e.message).join('; ')}`);
  return JSON.parse(JSON.stringify(res.data));
}

// The document must be a mutation, and every argument of `field` must come
// from a variable rather than being typed into the document.
function assertMutationWithVariables(doc, field) {
  const ops = doc.definitions.filter((d) => d.kind === Kind.OPERATION_DEFINITION);
  expect(ops.length === 1 && ops[0].operation === 'mutation', 'the document must contain one `mutation` operation');
  let seen = false;
  visit(doc, {
    Field(node) {
      if (node.name.value !== field) return;
      seen = true;
      for (const a of node.arguments) {
        expect(a.value.kind === Kind.VARIABLE, `${field}(${a.name.value}: ...) is hard-coded — pass it as a variable`);
      }
    },
  });
  expect(seen, `the mutation doesn't call ${field}`);
}

await check('01: addBook is called as a mutation, with its input passed as a variable', () => {
  assertMutationWithVariables(parse(read('01-add-book.graphql')), 'addBook');
});

await check('01: variables add "The Dispossessed" (1974) by author "1"', () => {
  expectEqual(readJson('01-add-book.variables.json'),
    { input: { title: 'The Dispossessed', year: 1974, authorId: '1' } }, 'variables file: ');
});

await check('01: the mutation returns the new book\'s id, title and author name', async () => {
  const schema = createSchema();
  const data = await run(schema, read('01-add-book.graphql'), readJson('01-add-book.variables.json'));
  expectEqual(data, { addBook: { id: '8', title: 'The Dispossessed', author: { name: 'Ursula K. Le Guin' } } });
  const after = await run(schema, '{ author(id: "1") { books { title } } }');
  expect(after.author.books.some((b) => b.title === 'The Dispossessed'), 'the book was not saved');
});

await check('02: rateBook is a mutation with id and rating passed as variables', () => {
  assertMutationWithVariables(parse(read('02-rate-book.graphql')), 'rateBook');
});

await check('02: rates book "4" (Small Gods) 5 stars and returns its id and rating', async () => {
  const vars = readJson('02-rate-book.variables.json');
  expectEqual(vars, { id: '4', rating: 5 }, 'variables file: ');
  const data = await run(createSchema(), read('02-rate-book.graphql'), vars);
  expectEqual(data, { rateBook: { id: '4', rating: 5 } });
});

await check('03: you found the error code for an out-of-range rating', async () => {
  const res = await graphql({
    schema: createSchema(),
    source: 'mutation { rateBook(id: "4", rating: 9) { id } }',
  });
  const expected = res.errors[0].extensions.code;
  const answer = read('03-error-code.txt').split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#'));
  expectEqual(answer ?? '', expected);
});

await check('04: ONE mutation document deletes books "6" and "7" using two aliased deleteBook fields', async () => {
  const doc = parse(read('04-cleanup.graphql'));
  const ops = doc.definitions.filter((d) => d.kind === Kind.OPERATION_DEFINITION);
  expect(ops.length === 1 && ops[0].operation === 'mutation', 'the document must contain one `mutation` operation');
  const deletes = ops[0].selectionSet.selections.filter((s) => s.name?.value === 'deleteBook');
  expect(deletes.length === 2, `expected 2 deleteBook fields, found ${deletes.length}`);
  expect(deletes.every((s) => s.alias), 'give each deleteBook an alias, e.g. removeDuplicate: deleteBook(...)');

  const schema = createSchema();
  const data = await run(schema, read('04-cleanup.graphql'));
  expect(Object.values(data).every((v) => v === true), `both deletes should return true, got ${JSON.stringify(data)}`);
  const ids = (await run(schema, '{ books { id } }')).books.map((b) => b.id);
  expectEqual(ids, ['1', '2', '3', '4', '5'], 'remaining book ids: ');
});
