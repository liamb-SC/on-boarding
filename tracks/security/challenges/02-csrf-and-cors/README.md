# 02 · CSRF tokens, SameSite cookies and a CORS allowlist

**Skills:** cross-site request forgery, the synchronizer-token pattern,
`SameSite` / `HttpOnly` cookie flags, CORS allowlists, credentials, preflight
requests.

## Background
**CSRF.** Browsers attach your cookies to every request to a site, *whoever
starts it*. A page on `evil.example` can auto-submit a hidden form to
`bank.example/transfer`, and the bank sees a perfectly logged-in request.
Two defences, best used together:
- **`SameSite=Lax`** on the session cookie: the browser leaves it off
  cross-site POSTs (and iframes/fetches). `Strict` drops it on cross-site
  links too. `None` (which needs `Secure`) sends it everywhere.
- **A CSRF token:** a random secret stored in the session that every
  state-changing request must echo back (header or hidden form field). The
  attacker's page can send your cookie but can't *read* your token.

**CORS** is a different thing. It doesn't block requests. It decides which
other origins may **read responses** from your API in a browser. The server
answers with `Access-Control-Allow-Origin`. Reflecting *any* `Origin` while also
sending `Access-Control-Allow-Credentials: true` lets every website make
logged-in calls and read your users' data. Requests with custom headers
(`X-CSRF-Token`) or JSON bodies first send an `OPTIONS` **preflight** asking
for permission.

## Scenario
A tiny bank API (`app.js`). Its session cookie has no protective flags, the
CSRF helpers in `csrf.js` are stubs, and CORS reflects any origin.

## Goal
1. `csrf.js`: implement `csrfToken(req)`: 32 random bytes as hex, created once
   per session and stored on `req.session.csrfToken`.
2. `csrf.js`: implement `requireCsrf`: accept the token from the
   `X-CSRF-Token` header or a `_csrf` form field, compare with
   `crypto.timingSafeEqual`, and respond `403` if it's missing or wrong.
3. `app.js`: allow only `ALLOWED_ORIGINS` (exact match) with credentials. Other
   origins get no CORS headers, but still a normal response (not an error).
   Requests without an `Origin` still work. Preflights allow `X-CSRF-Token`.
4. `app.js`: make the session cookie `HttpOnly` and `SameSite=Lax`.

## Try it
```bash
npm start
curl -si -c jar -H 'content-type: application/json' -d '{"username":"alice"}' localhost:3000/login
curl -s  -b jar localhost:3000/csrf-token
curl -si -b jar -H 'content-type: application/json' -H 'x-csrf-token: <token>' \
     -d '{"to":"bob","amount":10}' localhost:3000/transfer
curl -si -X OPTIONS localhost:3000/transfer -H 'origin: https://evil.example' \
     -H 'access-control-request-method: POST'
```

## Hints
- `req.session.csrfToken ??= ...` creates it once.
- `timingSafeEqual` throws if the buffers have different lengths, so compare
  lengths first.
- `cors` accepts an array for `origin`, or a function
  `(origin, callback) => callback(null, allowed)`. `origin` is `undefined`
  for non-browser requests. Passing an `Error` to the callback turns into a 500.
- `cors` reflects the requested headers in preflights by default. Setting
  `allowedHeaders` explicitly is clearer.
- With an allowlist you never need `Access-Control-Allow-Origin: *`. Browsers
  refuse `*` together with credentials anyway.

## Check your work
```
./onboard validate security/02
```
