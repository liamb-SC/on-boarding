# 04 · OAuth 2.0: authorization code + PKCE

**Skills:** the authorization code flow, PKCE (`code_verifier` /
`code_challenge`, S256), the `state` parameter, the token endpoint,
calling an API with a Bearer token.

## Background
OAuth lets a user log in to *your* app through someone else's
**authorization server** (Google, GitHub, Okta, your company's IdP) without
your app ever seeing their password. The **authorization code** flow:

```
browser ──/login──▶ your app ──302──▶ AS /authorize?client_id&redirect_uri&state&code_challenge
                                        (user logs in and approves)
browser ◀──302 redirect_uri?code&state── AS
browser ──/callback?code&state──▶ your app ──POST /token (code + code_verifier)──▶ AS
                                  your app ◀── { access_token } ──
```

- **PKCE** (RFC 7636): before redirecting, the app makes a random secret
  `code_verifier` and sends only its hash, `code_challenge = BASE64URL(SHA256(verifier))`.
  When it redeems the code it sends the verifier. Someone who intercepts the
  code (a malicious app, a leaked log) can't use it without the verifier. It's
  required for public clients (SPAs, mobile) and recommended for everyone.
- **`state`** is a random value you store before redirecting and compare on
  the way back. Without it an attacker can send you a callback link with *their*
  code, logging you in to their account (login CSRF).
- Codes are **single-use** and short-lived. The token request is a
  form-encoded `POST`, server to server, so the token never passes through the
  browser's address bar.

## Scenario
`app.js` is the "Notes" web app. `auth-server.js` is a mock authorization
server that auto-approves everyone as `alice`. Read it, it's short. `/login`,
`/callback` and both functions in `pkce.js` are TODOs.

## Goal
1. `pkce.js`: `createVerifier()` (random, 43–128 unreserved chars) and
   `challengeFor(verifier)` (S256, base64url, no padding).
2. `/login`: create a verifier and a random `state`, keep both in
   `req.session.oauth`, and redirect to `/authorize` with `response_type=code`,
   `client_id`, `redirect_uri`, `scope=profile`, `state`, `code_challenge` and
   `code_challenge_method=S256`.
3. `/callback`: reject (400) errors, missing sessions and state mismatches
   **before** touching the code. Clear the pending login, exchange the code at
   `/token`, store the `access_token` and redirect to `/me`. A failed exchange
   is a 400.

## Try it
```bash
npm run auth-server     # terminal 1, http://localhost:9000
npm start               # terminal 2, then open http://localhost:3000/login in a browser
curl -si 'localhost:9000/authorize?client_id=notes-app&redirect_uri=http://localhost:3000/callback&response_type=code'
```

## Hints
- `randomBytes(32).toString('base64url')` gives a 43-character verifier.
- `createHash('sha256').update(verifier).digest('base64url')`.
- `new URLSearchParams({...})` builds the query string, and also works as a
  `fetch` body (it sets the form content type for you).
- Do the state check first, and delete `req.session.oauth` whatever happens
  next, so a state can't be used twice.

## Check your work
```
./onboard validate security/04
```
