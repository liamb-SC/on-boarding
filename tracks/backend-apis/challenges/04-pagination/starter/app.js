import express from 'express';
import { createPosts } from './posts.js';
import { cursorPage, offsetPage } from './pagination.js';

// ?limit= defaults to 10, and is capped at 50 so nobody can ask for a million rows.
const parseLimit = (q) => Math.min(Math.max(Number.parseInt(q ?? '10', 10) || 10, 1), 50);

export function createApp(rows = createPosts()) {
  const app = express();

  // Offset pagination: /posts?limit=5&offset=10
  app.get('/posts', (req, res) => {
    const offset = Math.max(Number.parseInt(req.query.offset ?? '0', 10) || 0, 0);
    res.json(offsetPage(rows, { limit: parseLimit(req.query.limit), offset }));
  });

  // Cursor pagination: /posts/feed?limit=5, then /posts/feed?limit=5&cursor=<nextCursor>
  app.get('/posts/feed', (req, res) => {
    res.json(cursorPage(rows, { limit: parseLimit(req.query.limit), cursor: req.query.cursor }));
  });

  app.use((err, req, res, next) => {
    res.status(err.status ?? 500).json({ error: err.status ? err.message : 'Internal Server Error' });
  });
  return app;
}
