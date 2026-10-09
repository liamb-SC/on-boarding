// Node's OWN thread pool: libuv runs fs, dns.lookup, crypto.pbkdf2, zlib...
// on UV_THREADPOOL_SIZE threads (default 4). Watch when each call finishes.
//   npm run uv-pool
//   UV_THREADPOOL_SIZE=8 npm run uv-pool
import { pbkdf2 } from 'node:crypto';

const t0 = performance.now();
for (let i = 1; i <= 8; i++) {
  pbkdf2('secret', 'salt', 300_000, 64, 'sha512', () => {
    console.log(`hash ${i} done at ${Math.round(performance.now() - t0)}ms`);
  });
}
