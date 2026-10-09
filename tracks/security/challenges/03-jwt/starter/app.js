import express from 'express';
import { issueToken, verifyToken } from './auth.js';
import { users } from './users.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.post('/login', (req, res) => {
    const user = users.find((u) => u.name.toLowerCase() === String(req.body.username ?? '').toLowerCase());
    if (!user || user.password !== req.body.password) return res.status(401).json({ error: 'bad credentials' });
    res.json({ accessToken: issueToken(user), tokenType: 'Bearer' });
  });

  // Authorization: Bearer <token>
  const authenticate = (req, res, next) => {
    const [scheme, token] = (req.get('authorization') ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'missing token' });
    try {
      req.auth = verifyToken(token);
    } catch (err) {
      return res.status(401).json({ error: `invalid token: ${err.message}` });
    }
    next();
  };

  app.get('/me', authenticate, (req, res) => {
    const user = users.find((u) => u.id === req.auth.sub);
    if (!user) return res.status(401).json({ error: 'unknown subject' });
    res.json({ id: user.id, name: user.name, role: user.role });
  });

  return app;
}
