// A long-lived worker: it handles one task message at a time, forever.
// Protocol: receives `data`, replies { result } or { error: message }.
import { parentPort, threadId } from 'node:worker_threads';

function countPrimes(limit) {
  let count = 0;
  for (let n = 2; n < limit; n++) {
    let prime = true;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) { prime = false; break; }
    if (prime) count++;
  }
  return count;
}

parentPort.on('message', (data) => {
  try {
    if (!(data?.n > 0)) throw new Error(`bad task: ${JSON.stringify(data)}`);
    parentPort.postMessage({ result: { primes: countPrimes(data.n), threadId } });
  } catch (err) {
    parentPort.postMessage({ error: err.message });
  }
});
