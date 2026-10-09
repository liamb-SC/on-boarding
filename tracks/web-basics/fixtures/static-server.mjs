// A minimal static file server for the current directory, so pages load over
// http:// (DevTools, Lighthouse and ES modules all want that):
//   npm start        # http://localhost:8080
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json',
};
const port = Number(process.env.PORT ?? 8080);

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.join(root, decodeURIComponent(url.pathname.endsWith('/') ? `${url.pathname}index.html` : url.pathname));
  try {
    if (!file.startsWith(root)) throw new Error('outside root');
    const body = await readFile(file);
    // Slow every response down a little, so performance problems are visible.
    await new Promise((r) => setTimeout(r, 150));
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
