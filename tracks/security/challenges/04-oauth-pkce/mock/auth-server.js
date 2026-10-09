// A tiny mock OAuth 2.0 authorization server: authorization code + PKCE only.
// It auto-approves every login as "alice", so you can focus on the client.
// Spec references: RFC 6749 (OAuth 2.0), RFC 7636 (PKCE), RFC 8252 (loopback redirects).
import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import express from 'express';

const CLIENTS = { 'notes-app': { name: 'Notes app' } };
const USER = { sub: 'alice', name: 'Alice Example', email: 'alice@example.com' };

// Native/dev apps may register a loopback redirect on any port (RFC 8252 §7.3).
const redirectOk = (uri) => {
  try {
    const u = new URL(uri);
    return u.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(u.hostname) && u.pathname === '/callback';
  } catch { return false; }
};

export function createAuthServer() {
  const app = express();
  const codes = new Map();   // code -> { clientId, redirectUri, challenge, expires }
  const tokens = new Map();  // access token -> user
  app.locals.codes = codes;

  app.get('/authorize', (req, res) => {
    const q = req.query;
    // Never redirect to a URI we can't verify: show the error instead.
    if (!CLIENTS[q.client_id]) return res.status(400).send('unknown client_id');
    if (!redirectOk(q.redirect_uri)) return res.status(400).send('redirect_uri not registered for this client');

    const back = (params) => {
      const u = new URL(q.redirect_uri);
      for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
      if (q.state !== undefined) u.searchParams.set('state', q.state);
      res.redirect(302, u.href);
    };
    if (q.response_type !== 'code') return back({ error: 'unsupported_response_type' });
    if (!q.code_challenge) return back({ error: 'invalid_request', error_description: 'PKCE code_challenge is required' });
    if (q.code_challenge_method !== 'S256') return back({ error: 'invalid_request', error_description: 'code_challenge_method must be S256' });

    const code = randomBytes(16).toString('base64url');
    codes.set(code, { clientId: q.client_id, redirectUri: q.redirect_uri, challenge: q.code_challenge, expires: Date.now() + 60_000 });
    back({ code });
  });

  // The token endpoint takes a form-encoded body, as the spec says.
  app.post('/token', express.urlencoded({ extended: false }), (req, res) => {
    const b = req.body ?? {};
    const fail = (error, error_description) => res.status(400).json({ error, error_description });
    if (b.grant_type !== 'authorization_code') return fail('unsupported_grant_type', 'expected grant_type=authorization_code (form-encoded body)');
    const grant = codes.get(b.code);
    codes.delete(b.code); // codes are single-use, even if this attempt fails
    if (!grant || grant.expires < Date.now()) return fail('invalid_grant', 'unknown, used or expired code');
    if (b.client_id !== grant.clientId) return fail('invalid_grant', 'client_id does not match');
    if (b.redirect_uri !== grant.redirectUri) return fail('invalid_grant', 'redirect_uri does not match');
    if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(b.code_verifier ?? '')) return fail('invalid_request', 'code_verifier must be 43-128 unreserved characters');
    const challenge = createHash('sha256').update(b.code_verifier).digest('base64url');
    if (challenge !== grant.challenge) return fail('invalid_grant', 'PKCE verification failed');

    const accessToken = randomBytes(24).toString('base64url');
    tokens.set(accessToken, USER);
    res.json({ access_token: accessToken, token_type: 'Bearer', expires_in: 3600, scope: 'profile' });
  });

  app.get('/userinfo', (req, res) => {
    const [, token] = (req.get('authorization') ?? '').split(' ');
    const user = tokens.get(token);
    if (!user) return res.status(401).json({ error: 'invalid_token' });
    res.json(user);
  });

  return app;
}

// `npm run auth-server` runs it on port 9000.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT ?? 9000;
  createAuthServer().listen(port, () => console.log(`Mock authorization server on http://localhost:${port}`));
}
