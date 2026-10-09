// npm run demo -- local     two app processes, each with its own in-memory Map
// npm run demo -- shared    two app processes sharing one cache server
import { spawn } from 'node:child_process';
import { db } from './db.js';

const mode = process.argv[2] === 'shared' ? 'shared' : 'local';
const children = [];

// Start a node process and wait for its "listening on <port>" line.
function start(file, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file], { env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'inherit'] });
    children.push(child);
    child.stdout.on('data', (d) => { const m = /listening on (\d+)/.exec(d); if (m) resolve(Number(m[1])); });
    child.on('exit', (code) => reject(new Error(`${file} exited with ${code}`)));
  });
}

try {
  db.reset();
  const cachePort = await start('cache-server.js', { PORT: '0' });
  const env = { CACHE: mode, CACHE_URL: `http://127.0.0.1:${cachePort}` };
  const a = await start('server.js', env);
  const b = await start('server.js', env);
  const get = async (port) => (await fetch(`http://127.0.0.1:${port}/price/sku-1`)).json();

  console.log('B reads sku-1:          ', await get(b));
  await fetch(`http://127.0.0.1:${a}/price/sku-1`, { method: 'PUT', body: JSON.stringify({ price: 12 }) });
  console.log('A updates sku-1 to 12');
  const after = await get(b);
  console.log('B reads sku-1 again:    ', after);
  console.log(after.price === 12 ? '✓ B sees the new price' : '✗ B is serving a STALE price from its own memory');
} finally {
  children.forEach((c) => c.kill());
}
