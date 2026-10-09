// npm run groq -- <file.groq> [params.json]
// Runs a GROQ query against dataset.json, locally, the same way Sanity's
// Content Lake would, and prints the result.
import { readFileSync } from 'node:fs';
import { evaluate, parse } from 'groq-js';

const [file, paramsFile] = process.argv.slice(2);
if (!file) {
  console.error('usage: npm run groq -- <file.groq> [params.json]');
  process.exit(1);
}
const dataset = JSON.parse(readFileSync(new URL('./dataset.json', import.meta.url), 'utf8'));
const params = paramsFile ? JSON.parse(readFileSync(paramsFile, 'utf8')) : {};

const tree = parse(readFileSync(file, 'utf8'), { params });
const result = await (await evaluate(tree, { dataset, params })).get();
console.log(JSON.stringify(result, null, 2));
