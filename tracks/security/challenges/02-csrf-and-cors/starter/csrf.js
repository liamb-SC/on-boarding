import { randomBytes, timingSafeEqual } from 'node:crypto';

// The synchronizer-token pattern: each session gets a random secret token.
// The page (or SPA) reads it from GET /csrf-token and sends it back with every
// state-changing request. A forged request from evil.example rides along with
// the victim's cookie, but it can't read the token, so it can't include it.

// csrfToken(req) — return this session's token, creating it on first use
// (32 random bytes as hex, stored on req.session.csrfToken).
export function csrfToken(req) {
  // TODO 1
  return '';
}

// requireCsrf — middleware for POST/PUT/PATCH/DELETE routes. Take the token
// from the X-CSRF-Token header or a `_csrf` form field and compare it with
// the session's token using timingSafeEqual (check the lengths first, it
// throws on a mismatch). Missing or wrong -> 403 { error: 'invalid csrf token' }.
export function requireCsrf(req, res, next) {
  // TODO 2
  next();
}
