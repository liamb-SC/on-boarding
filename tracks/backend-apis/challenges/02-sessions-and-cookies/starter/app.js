import express from 'express';
import session from 'express-session';
import { users } from './users.js';

export function createApp() {
  const app = express();
  const production = process.env.NODE_ENV === 'production';

  // Behind a load balancer / TLS terminator, trust its X-Forwarded-Proto so
  // req.secure is true for HTTPS requests. Needed for `secure` cookies.
  app.set('trust proxy', 1);
  app.use(express.json());

  // TODO 1: add the express-session middleware. Configure it properly:
  //   - secret: process.env.SESSION_SECRET ?? 'dev-only-secret'
  //   - name: 'sid'               (don't advertise the default "connect.sid")
  //   - resave: false, saveUninitialized: false
  //   - cookie: httpOnly, sameSite 'lax', maxAge one hour, and
  //             secure only in production (local http://localhost has no TLS)

  // Counts page views in the session. Visiting this before logging in gives
  // you a session cookie, which login must NOT keep using (session fixation).
  app.get('/visit', (req, res) => {
    req.session.views = (req.session.views ?? 0) + 1;
    res.json({ views: req.session.views });
  });

  // TODO 2: POST /login { username, password }
  //   - wrong credentials -> 401 { "error": "..." }
  //   - right ones: req.session.regenerate(...) FIRST (a fresh session id),
  //     then store the user's id in the session and respond 200 { id, name }

  // TODO 3: GET /me -> 200 { id, name } of the logged-in user, else 401

  // TODO 4: POST /logout -> req.session.destroy(...), clear the 'sid' cookie,
  //   respond 204

  return app;
}
