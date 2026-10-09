# 03 · JWT access tokens

**Skills:** `jsonwebtoken` `sign`/`verify`, standard claims (`sub`, `exp`,
`iss`, `aud`), expiry, pinning the algorithm, what not to put in a token.

## Background
A **JSON Web Token** is three base64url parts: `header.payload.signature`.

```
{"alg":"HS256","typ":"JWT"} . {"sub":"1","role":"admin","exp":1767225600} . <HMAC of the first two>
```

- The payload is **encoded, not encrypted**. Anyone holding the token can read
  it (paste one into jwt.io). Never put secrets or personal data in it.
- The **signature** is the whole point. `jwt.verify` recomputes it with your
  secret and also checks `exp`, `iss` and `aud`. `jwt.decode` does none of
  that. It's for *reading* a token you've already verified.
- **Standard claims:** `sub` (who), `exp` (until when), `iss` (who issued it),
  `aud` (who it's for, so a token for service A can't be replayed at B).
- **Algorithm pitfalls:** the token's header says which algorithm to use,
  and attackers control the header. Classic attacks are `"alg": "none"` (no
  signature at all) and algorithm confusion (RS256 public key used as an HS256
  secret). Always tell `verify` which algorithms you accept.
- Keep access tokens **short-lived** (minutes). You can't revoke a stateless
  token, so expiry is your safety net. Refresh tokens and sessions handle
  "stay logged in".

## Scenario
`auth.js` signs the whole user object (password included) with no expiry,
and "verifies" tokens with `jwt.decode`. Right now anyone can mint an admin
token by hand.

## Goal
In `auth.js`:
1. `issueToken(user)`: payload `{ name, role }` only, `sub` = user id,
   `HS256`, expires in **15 minutes**, `iss` = `ISSUER`, `aud` = `AUDIENCE`.
2. `verifyToken(token)`: use `jwt.verify` and only accept `HS256` tokens with
   the right issuer and audience. Invalid, tampered, unsigned, expired or
   foreign tokens must **throw**.

Keep exporting `JWT_SECRET`, `ISSUER` and `AUDIENCE`. The validator uses them
to forge tokens and attack your `verifyToken`.

## Try it
```bash
npm start
TOKEN=$(curl -s localhost:3000/login -H 'content-type: application/json' \
  -d '{"username":"alice","password":"correct horse battery staple"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')
echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null; echo     # anyone can read the payload
curl -s localhost:3000/me -H "authorization: Bearer $TOKEN"
```

## Hints
- `jwt.sign(payload, secret, { algorithm, expiresIn: '15m', subject, issuer, audience })`.
  `subject` must be a string.
- `jwt.verify(token, secret, { algorithms: ['HS256'], issuer, audience })`
  throws `TokenExpiredError` / `JsonWebTokenError` for you.
- Without `algorithms`, a string secret accepts HS256, HS384 *and* HS512.
  That's harmless here, but it's the habit that stops algorithm confusion when
  you use RS256 keys.

## Check your work
```
./onboard validate security/03
```
