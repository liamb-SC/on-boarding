// Builds the monthly sales report. Users say it's slow, but nobody knows which
// part. This file runs both in Node (npm run report) and in the browser (npm start).

const REGIONS = ['north', 'south', 'east', 'west'];

// "Parse" the sales export. Slow on purpose, like a real big CSV.
export function loadRows() {
  const rows = [];
  for (let i = 0; i < 40000; i++) rows.push({ region: REGIONS[i % 4], amount: (i * 37) % 500 });
  const end = performance.now() + 120;
  while (performance.now() < end) { /* the slow part of parsing */ }
  return rows;
}

// Total sales per region.
export function aggregate(rows) {
  const totals = {};
  for (const { region, amount } of rows) totals[region] = (totals[region] ?? 0) + amount;
  return totals;
}

export function buildReport() {
  const rows = loadRows();
  const totals = aggregate(rows);
  return totals;
}
