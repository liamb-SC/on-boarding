import { randomBytes } from 'node:crypto';
import express from 'express';
import session from 'express-session';
import { challengeFor, createVerifier } from './pkce.js';

export const CLIENT_ID = 'notes-app';

// createApp({ authServerUrl, redirectUri }) — the "Notes" web app, an OAuth client.
export function createApp({ authServerUrl, redirectUri }) {
  const app = express();
  app.use(session({
    secret: 'dev-only-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' },
  }));

  // Step 1: send the user to the authorization server.
  app.get('/login', (req, res) => {
    // TODO 3:
    //  - make a code_verifier and a random `state` (e.g. 16 bytes, base64url)
    //  - remember both in the session: req.session.oauth = { state, verifier }
    //  - redirect (302) to `${authServerUrl}/authorize` with query parameters
    //    response_type=code, client_id, redirect_uri, scope=profile, state,
    //    code_challenge and code_challenge_method=S256
    res.status(501).send('TODO: /login');
  });

  // Step 2: the authorization server sends the browser back here with ?code&state.
  app.get('/callback', async (req, res) => {
    // TODO 4:
    //  - an ?error=... from the server -> 400
    //  - no login in progress, or ?state doesn't match the session's -> 400
    //    (this stops an attacker logging you in to THEIR account)
    //  - clear req.session.oauth so the same state can't be used twice
    //  - POST `${authServerUrl}/token` as application/x-www-form-urlencoded:
    //    grant_type=authorization_code, code, redirect_uri, client_id, code_verifier
    //  - token endpoint said no -> 400; otherwise save the access_token in
    //    req.session.accessToken and redirect (302) to /me
    res.status(501).send('TODO: /callback');
  });

  // Who am I? Calls the authorization server's userinfo endpoint with the token.
  app.get('/me', async (req, res) => {
    if (!req.session.accessToken) return res.status(401).json({ error: 'not logged in: visit /login' });
    const r = await fetch(`${authServerUrl}/userinfo`, { headers: { authorization: `Bearer ${req.session.accessToken}` } });
    res.status(r.status).json(await r.json());
  });

  return app;
}
