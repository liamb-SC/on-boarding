import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const { graphql } = await fromSandbox('graphql');

// This time the schema under test is the learner's own schema.js.
let createSchema;
const loaded = await check('schema.js loads and still exports createSchema()', async () => {
  ({ createSchema } = await fromSandbox('./schema.js'));
  expect(typeof createSchema === 'function', 'schema.js must export createSchema');
  createSchema();
});
if (!loaded) process.exit(1);

async function run(schema, source, variableValues) {
  const res = await graphql({ schema, source, variableValues });
  expect(!res.errors, `errors: ${res.errors?.map((e) => e.message).join('; ')}`);
  return JSON.parse(JSON.stringify(res.data));
}
async function runExpectingError(schema, source, variableValues) {
  const res = await graphql({ schema, source, variableValues });
  expect(res.errors?.length, 'expected an error, but the operation succeeded');
  return res.errors[0];
}
function fieldType(schema, typeName, field) {
  const type = schema.getType(typeName);
  expect(type, `type ${typeName} is not in the schema`);
  const f = type.getFields()[field];
  expect(f, `${typeName}.${field} is not in the schema`);
  return f;
}

await check('existing queries still work (no regressions)', async () => {
  const data = await run(createSchema(), '{ book(id: "1") { title author { name } } }');
  expectEqual(data, { book: { title: 'A Wizard of Earthsea', author: { name: 'Ursula K. Le Guin' } } });
});

await check('1: Author.bookCount is declared as Int!', () => {
  expectEqual(String(fieldType(createSchema(), 'Author', 'bookCount').type), 'Int!');
});

await check('1: bookCount resolves to each author\'s number of books', async () => {
  const data = await run(createSchema(), '{ authors { name bookCount } }');
  expectEqual(data.authors, [
    { name: 'Ursula K. Le Guin', bookCount: 2 },
    { name: 'Terry Pratchett', bookCount: 3 },
    { name: 'Octavia E. Butler', bookCount: 2 },
  ]);
});

await check('2: Query.searchBooks(term: String!) is declared, returning [Book!]!', () => {
  const f = fieldType(createSchema(), 'Query', 'searchBooks');
  expectEqual(String(f.type), '[Book!]!', 'return type: ');
  expectEqual(f.args.map((a) => `${a.name}: ${a.type}`), ['term: String!'], 'arguments: ');
});

await check('2: searchBooks matches titles case-insensitively (and returns [] for no match)', async () => {
  const schema = createSchema();
  const q = 'query ($t: String!) { searchBooks(term: $t) { title } }';
  const titles = async (t) => (await run(schema, q, { t })).searchBooks.map((b) => b.title);
  expectEqual(await titles('guards'), ['Guards! Guards!', 'Guards! Guards! (duplicate)'], '"guards": ');
  expectEqual(await titles('DARKNESS'), ['The Left Hand of Darkness'], '"DARKNESS": ');
  expectEqual(await titles('zzz'), [], '"zzz": ');
});

await check('3: Review type, AddReviewInput and Book.reviews are declared as specified', () => {
  const schema = createSchema();
  const shape = (name) => Object.fromEntries(
    Object.values(schema.getType(name)?.getFields() ?? {}).map((f) => [f.name, String(f.type)]));
  expectEqual(shape('Review'), { id: 'ID!', stars: 'Int!', comment: 'String', book: 'Book!' }, 'Review: ');
  expectEqual(shape('AddReviewInput'), { bookId: 'ID!', stars: 'Int!', comment: 'String' }, 'AddReviewInput: ');
  expectEqual(String(fieldType(schema, 'Book', 'reviews').type), '[Review!]!', 'Book.reviews: ');
  const add = fieldType(schema, 'Mutation', 'addReview');
  expectEqual(String(add.type), 'Review!', 'addReview return type: ');
  expectEqual(add.args.map((a) => `${a.name}: ${a.type}`), ['input: AddReviewInput!'], 'addReview arguments: ');
});

const ADD = 'mutation ($input: AddReviewInput!) { addReview(input: $input) { id stars comment book { title } } }';

await check('3: addReview saves a review and it shows up on Book.reviews', async () => {
  const schema = createSchema();
  const data = await run(schema, ADD, { input: { bookId: '5', stars: 5, comment: 'Brilliant' } });
  expectEqual(data.addReview, { id: '1', stars: 5, comment: 'Brilliant', book: { title: 'Kindred' } });
  const second = await run(schema, ADD, { input: { bookId: '5', stars: 4 } });
  expectEqual(second.addReview, { id: '2', stars: 4, comment: null, book: { title: 'Kindred' } },
    'a second review with no comment: ');
  const after = await run(schema, '{ book(id: "5") { reviews { stars comment } } }');
  expectEqual(after.book.reviews, [{ stars: 5, comment: 'Brilliant' }, { stars: 4, comment: null }]);
  const other = await run(schema, '{ book(id: "1") { reviews { id } } }');
  expectEqual(other.book.reviews, [], 'reviews of a different book: ');
});

await check('3: stars outside 1–5 is rejected with code BAD_USER_INPUT (and nothing is saved)', async () => {
  const schema = createSchema();
  const err = await runExpectingError(schema, ADD, { input: { bookId: '5', stars: 7 } });
  expectEqual(err.extensions?.code, 'BAD_USER_INPUT', 'extensions.code: ');
  const after = await run(schema, '{ book(id: "5") { reviews { id } } }');
  expectEqual(after.book.reviews, [], 'saved reviews: ');
});

await check('3: reviewing a book that doesn\'t exist fails with code NOT_FOUND', async () => {
  const err = await runExpectingError(createSchema(), ADD, { input: { bookId: '999', stars: 3 } });
  expectEqual(err.extensions?.code, 'NOT_FOUND', 'extensions.code: ');
});
