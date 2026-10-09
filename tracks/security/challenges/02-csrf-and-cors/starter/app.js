import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { csrfToken, requireCsrf } from './csrf.js';

// The browser front-ends that are allowed to call this API with credentials.
export const ALLOWED_ORIGINS = ['https://app.example.com', 'http://localhost:5173'];

export function createApp() {
  const app = express();
  const balances = new Map();

  // TODO 3: this reflects ANY Origin back with credentials allowed, so every
  // website on the internet can make logged-in calls and read the answers.
  // Only allow ALLOWED_ORIGINS, and make sure preflights allow X-CSRF-Token.
  app.use(cors({ origin: true, credentials: true }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(session({
    name: 'sid',
    secret: 'dev-only-session-secret',
    resave: false,
    saveUninitialized: false,
    // TODO 4: the session cookie should be invisible to JavaScript and not sent
    // on cross-site POSTs.
    cookie: { httpOnly: false },
  }));

  const requireLogin = (req, res, next) =>
    req.session.user ? next() : res.status(401).json({ error: 'log in first' });

  app.post('/login', (req, res) => {
    const user = String(req.body.username ?? '');
    if (!user) return res.status(400).json({ error: 'username required' });
    req.session.user = user;
    if (!balances.has(user)) balances.set(user, 100);
    res.json({ user });
  });

  app.get('/csrf-token', requireLogin, (req, res) => res.json({ csrfToken: csrfToken(req) }));

  app.get('/balance', requireLogin, (req, res) => res.json({ balance: balances.get(req.session.user) }));

  app.post('/transfer', requireLogin, requireCsrf, (req, res) => {
    const amount = Number(req.body.amount);
    const from = req.session.user;
    if (!(amount > 0) || amount > balances.get(from)) return res.status(400).json({ error: 'bad amount' });
    balances.set(from, balances.get(from) - amount);
    res.json({ balance: balances.get(from) });
  });

  return app;
}
