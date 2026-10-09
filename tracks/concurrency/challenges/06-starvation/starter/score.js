// Some CPU work per row (a few microseconds). Don't edit this file.
export function score(row) {
  let h = row.id;
  for (let i = 0; i < 300; i++) h = (h * 31 + i) % 1_000_003;
  return h % 100;
}
