import { availableParallelism } from 'node:os';
import { countInParallel } from './counter.js';

console.log(`${availableParallelism()} CPU cores available`);
for (let run = 1; run <= 3; run++) {
  const got = await countInParallel({ workers: 4, iterations: 1_000_000 });
  console.log(`run ${run}: counted ${got.toLocaleString()} (expected 4,000,000)`);
}
