// A tiny JSON API. `npm run build` bundles it (and `ms`) into dist/server.mjs,
// so the production image needs no node_modules at all.
import http from 'node:http';
import ms from 'ms';

const port = Number(process.env.PORT ?? 3000);

const server = http.createServer((req, res) => {
  const send = (status, body) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  if (req.url === '/health') return send(200, { status: 'ok' });
  if (req.url === '/') return send(200, { message: 'hello from a container', uptime: ms(process.uptime() * 1000) });
  send(404, { error: 'not found' });
});

server.listen(port, () => console.log(`hello-api listening on :${port}`));

// Containers are stopped with SIGTERM. Exit promptly instead of waiting to be killed.
process.on('SIGTERM', () => server.close(() => process.exit(0)));
