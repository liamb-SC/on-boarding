// visits-api: counts page visits in Redis. The count lives in Redis, not in
// this process, so restarting or scaling the API doesn't lose it.
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';

const port = Number(process.env.PORT ?? 3000);
const redisHost = process.env.REDIS_HOST ?? 'localhost';

// Just enough of the Redis protocol for one command: send "INCR key", read ":<n>".
function incr(key) {
  return new Promise((resolve, reject) => {
    const sock = net.createConnection({ host: redisHost, port: 6379 });
    let reply = '';
    sock.setTimeout(2000, () => sock.destroy(new Error(`timed out talking to redis at ${redisHost}:6379`)));
    sock.on('connect', () => sock.write(`INCR ${key}\r\n`));
    sock.on('data', (chunk) => {
      reply += chunk;
      if (!reply.endsWith('\r\n')) return;
      sock.end();
      if (reply.startsWith(':')) resolve(Number(reply.slice(1)));
      else reject(new Error(`redis said: ${reply.trim()}`));
    });
    sock.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const send = (status, body) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  if (req.url === '/health') return send(200, { status: 'ok' });
  if (req.url === '/visits') {
    try {
      return send(200, { visits: await incr('visits'), servedBy: os.hostname() });
    } catch (err) {
      console.error(err.message);
      return send(503, { error: err.message });
    }
  }
  send(404, { error: 'not found' });
});

server.listen(port, () => console.log(`visits-api on :${port}, redis at ${redisHost}`));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
