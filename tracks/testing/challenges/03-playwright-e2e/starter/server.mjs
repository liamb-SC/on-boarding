// A minimal static file server for public/. Playwright starts it for you
// (see webServer in playwright.config.js), or run it yourself: npm start
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('public');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const port = Number(process.env.PORT ?? 4173);

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.join(root, url.pathname === '/' ? 'index.html' : url.pathname);
  try {
    if (!file.startsWith(root)) throw new Error('outside root');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(port, () => console.log(`Todo app on http://localhost:${port}`));
