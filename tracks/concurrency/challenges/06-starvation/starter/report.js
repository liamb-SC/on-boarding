import { score } from './score.js';

// Score every row and add it up. Resolves to { count, total }.
// It's `async`, but nothing in here ever gives the event loop a turn.
export async function buildReport(rows) {
  let total = 0;
  for (const row of rows) {
    total += score(row);
  }
  return { count: rows.length, total };
}
