import express from 'express';
import { createRateLimiter, waf } from './waf.js';

export function createApp() {
  const app = express();

  // TODO 4: put the rate limiter (100 requests per minute per IP) and then the
  // WAF in front of every route.

  app.get('/search', (req, res) => res.json({ q: req.query.q ?? '', results: [] }));
  app.get('/files', (req, res) => res.json({ name: req.query.name ?? '' }));
  app.get('/files/:name', (req, res) => res.json({ name: req.params.name }));
  return app;
}
