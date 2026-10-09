# 02 · Cookies and sessions

**Skills:** `express-session`, cookie flags (`HttpOnly`, `SameSite`, `Secure`,
`Max-Age`), login/logout, session fixation.

## Background
HTTP is stateless. A **session** keeps state on the server, and a **cookie**
holds only a random session id that the browser sends back on every request.

```
Set-Cookie: sid=s%3Ak2j...; Path=/; Expires=...; HttpOnly; SameSite=Lax; Secure
```

| Flag | Why |
|------|-----|
| `HttpOnly` | page JavaScript can't read it, so an XSS bug can't steal the session |
| `SameSite=Lax` | not sent on cross-site POSTs, which blocks most CSRF |
| `Secure` | only sent over HTTPS. Turn it on in production, not on `http://localhost` |
| `Expires` / `Max-Age` | how long the browser keeps it |

**Session fixation:** if an attacker can plant a session id in your browser
before you log in, and the server keeps using that id after login, they share
your logged-in session. The fix is to give the session a **new id at login**
(`req.session.regenerate`). On logout, **destroy** the session server-side.
Clearing the cookie isn't enough.

## Scenario
`app.js` has a `/visit` counter and a list of demo users, but no session
middleware and no auth routes.

## Goal
Follow the `TODO`s in `app.js`:
1. Configure `express-session`: cookie name `sid`, `HttpOnly`,
   `SameSite=Lax`, one-hour lifetime, `Secure` only when
   `NODE_ENV=production`.
2. `POST /login`: 401 for bad credentials. On success, regenerate the session,
   store the user id, and return `{ id, name }`.
3. `GET /me`: `{ id, name }` or 401.
4. `POST /logout`: destroy the session, clear the cookie, and return 204.

## Try it
```bash
npm start
curl -i -c jar.txt localhost:3000/visit                 # look at Set-Cookie
curl -i -b jar.txt -c jar.txt localhost:3000/login -H 'content-type: application/json' \
     -d '{"username":"ada","password":"lovelace"}'       # a different sid
curl -i -b jar.txt localhost:3000/me
```

## Hints
- `cookie: { maxAge: 60 * 60 * 1000, ... }` is in milliseconds.
- `regenerate` and `destroy` take a callback. Respond inside it.
- `res.clearCookie('sid')` clears the cookie.
- In production, `trust proxy` lets `req.secure` see the proxy's HTTPS. Without
  it, `express-session` won't send a `Secure` cookie at all.

## Check your work
```
./onboard validate backend-apis/02
```
