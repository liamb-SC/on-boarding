import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const { parse, evaluate } = await fromSandbox('groq-js');
// The validator's own copy of the data, so editing dataset.json doesn't help.
const dataset = JSON.parse(readFileSync(new URL('./starter/dataset.json', import.meta.url), 'utf8'));
const read = (f) => readFileSync(path.join(SANDBOX, 'queries', f), 'utf8');

async function run(query, params = {}) {
  return (await evaluate(parse(query, { params }), { dataset, params })).get();
}
// Run the learner's query and a reference one; results must match exactly
// (same order, same fields, nothing extra).
async function sameAs(file, reference, params) {
  const got = await run(read(file), params);
  expectEqual(got, await run(reference, params));
  return got;
}
const PUBLISHED = '_type == "movie" && !(_id in path("drafts.**"))';

await check('01: movies from 2010 onwards, newest first, as { title, releaseYear }', () =>
  sameAs('01-recent.groq', `*[${PUBLISHED} && releaseYear >= 2010] | order(releaseYear desc) { title, releaseYear }`));

await check('02: the "alien" movie as ONE object { title, director } (director\'s name)', () =>
  sameAs('02-alien.groq', `*[${PUBLISHED} && slug.current == "alien"][0] { title, "director": director->name }`));
await check('02: the director comes from following the reference (->)', () =>
  expect(read('02-alien.groq').includes('->'), 'use director->name rather than hard-coding anything'));

await check('03: movies in the $genre given by 03-by-genre.params.json ("drama"), by title', async () => {
  const params = JSON.parse(read('03-by-genre.params.json'));
  expectEqual(params, { genre: 'drama' }, 'params file: ');
  await sameAs('03-by-genre.groq', `*[${PUBLISHED} && $genre in genres] | order(title asc) { title }`, params);
});
await check('03: the query really uses $genre (works for "action" too)', async () => {
  expect(read('03-by-genre.groq').includes('$genre'), 'no $genre in the query');
  await sameAs('03-by-genre.groq', `*[${PUBLISHED} && $genre in genres] | order(title asc) { title }`, { genre: 'action' });
});

await check('04: the 3 highest-rated movies as { title, rating }', () =>
  sameAs('04-top-rated.groq', `*[${PUBLISHED}] | order(rating desc) [0...3] { title, rating }`));

await check('05: every person (by name) with the number of movies they directed', () =>
  sameAs('05-directors.groq',
    `*[_type == "person"] | order(name asc) { name, "directed": count(*[${PUBLISHED} && director._ref == ^._id]) }`));
