// A tiny books API for practising HTTP clients. No dependencies.
//   npm run server            -> http://localhost:3000
// Every route needs `Authorization: Bearer secret-token`.
//   GET /books        -> 200 [book, ...]
//   GET /books/:id    -> 200 book | 404 { error }
//   GET /slow         -> answers after 3 seconds
//   anything else     -> 404 { error }
import http from 'node:http';
import { pathToFileURL } from 'node:url';

export const TOKEN = 'secret-token';
const books = [
  { id: '1', title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin' },
  { id: '2', title: 'Kindred', author: 'Octavia E. Butler' },
  { id: '3', title: 'Guards! Guards!', author: 'Terry Pratchett' },
];

// startServer(port) -> { url, requests, close }. `requests` records each
// request's method, path and headers, so tests can see what a client sent.
export function startServer(port = 0) {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push({ method: req.method, path: req.url, headers: req.headers });
    const send = (status, body) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(401, { error: 'unauthorized' });
    if (req.url === '/books') return send(200, books);
    const m = req.url.match(/^\/books\/([^/]+)$/);
    if (m) {
      const book = books.find((b) => b.id === m[1]);
      return book ? send(200, book) : send(404, { error: `book ${m[1]} not found` });
    }
    if (req.url === '/slow') {
      const t = setTimeout(() => send(200, { finally: true }), 3000);
      req.on('close', () => clearTimeout(t));
      return;
    }
    send(404, { error: 'no such route' });
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${server.address().port}`;
      resolve({ url, requests, close: () => new Promise((r) => { server.closeAllConnections(); server.close(r); }) });
    });
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { url } = await startServer(Number(process.env.PORT ?? 3000));
  console.log(`books API on ${url} (token: ${TOKEN})`);
}
