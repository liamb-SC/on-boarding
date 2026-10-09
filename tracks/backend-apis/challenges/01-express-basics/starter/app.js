import express from 'express';
import { randomUUID } from 'node:crypto';
import { createStore } from './store.js';
import { notesRouter } from './routes/notes.js';

export function createApp() {
  const app = express();
  const store = createStore();

  // TODO 1: a request-id middleware. Every response must carry an
  //   X-Request-Id header: reuse the incoming X-Request-Id if the client sent
  //   one, otherwise generate one with randomUUID(). Don't forget next().

  // TODO 2: parse JSON request bodies (req.body), with express's built-in middleware.

  app.get('/health', (req, res) => res.json({ ok: true }));

  // A route that fails, to exercise the error handler.
  app.get('/boom', () => {
    throw new Error('database password is hunter2'); // must never reach the client!
  });

  // TODO 3/4: mount the notes router (routes/notes.js) at /notes.

  // TODO 5: a catch-all 404 for unknown routes: 404 { "error": "Not Found" }.

  // TODO 6: an error handler (the one with FOUR arguments: err, req, res, next).
  //   - use err.status (or err.statusCode) if it's a 4xx, e.g. bad JSON is 400
  //   - otherwise 500 { "error": "Internal Server Error" }
  //   - log the error server-side, but never send err.message/stack for a 500

  return app;
}
