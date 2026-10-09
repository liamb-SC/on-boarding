// npm run report: build the report in Node and print each measure as it lands.
import { watchMeasures } from './src/observe.js';
import { buildReport } from './src/report.js';

const observer = watchMeasures(({ name, duration }) => console.log(`${name.padEnd(18)} ${duration.toFixed(1)} ms`));
console.log(buildReport());
setTimeout(() => observer?.disconnect(), 0);
