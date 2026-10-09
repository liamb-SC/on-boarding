import express from 'express';
import { readFileSync } from 'node:fs';
// import swaggerUi from 'swagger-ui-express';

// The spec lives next to this file. Read it once at startup.
const spec = JSON.parse(readFileSync(new URL('./openapi.json', import.meta.url), 'utf8'));

export function createApp() {
  const app = express();
  app.use(express.json());

  const books = new Map([
    [1, { id: 1, title: 'Dune', author: 'Frank Herbert', year: 1965 }],
    [2, { id: 2, title: 'Neuromancer', author: 'William Gibson', year: 1984 }],
  ]);
  let nextId = 3;

  // TODO 1: serve the spec as JSON at GET /openapi.json
  // TODO 2: serve Swagger UI at /docs with swagger-ui-express (serve + setup(spec))

  app.get('/books', (req, res) => {
    const limit = Number(req.query.limit ?? 20);
    res.json([...books.values()].slice(0, limit));
  });

  app.get('/books/:id', (req, res) => {
    const book = books.get(Number(req.params.id));
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  });

  app.post('/books', (req, res) => {
    const { title, author, year } = req.body ?? {};
    if (typeof title !== 'string' || typeof author !== 'string') {
      return res.status(400).json({ error: 'title and author are required strings' });
    }
    const book = { id: nextId++, title, author, ...(Number.isInteger(year) && { year }) };
    books.set(book.id, book);
    res.status(201).json(book);
  });

  app.delete('/books/:id', (req, res) => {
    if (!books.delete(Number(req.params.id))) return res.status(404).json({ error: 'Book not found' });
    res.status(204).end();
  });

  return app;
}
