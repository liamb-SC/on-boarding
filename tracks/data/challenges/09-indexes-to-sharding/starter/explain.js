// npm run explain: show the query plans before and after indexes.sql, and how long each query takes.
import { readFileSync } from 'node:fs';
import { seededDb, QUERIES } from './seed.js';

const db = await seededDb();
const report = (label) => {
  console.log(`\n== ${label}`);
  for (const [name, { sql, params }] of Object.entries(QUERIES)) {
    const start = performance.now();
    for (let i = 0; i < 50; i += 1) db.all(sql, params);
    const ms = ((performance.now() - start) / 50).toFixed(3);
    console.log(`${name} (${ms} ms):`);
    for (const line of db.plan(sql, params)) console.log(`   ${line}`);
  }
};
report('without indexes');
db.exec(readFileSync('indexes.sql', 'utf8'));
report('with indexes.sql');
