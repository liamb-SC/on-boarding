# 04 · CDN and HTTP caching headers

**Skills:** `Cache-Control` (`max-age`, `s-maxage`, `no-cache`, `no-store`,
`private`, `immutable`), `ETag` / `If-None-Match` / `304 Not Modified`.

## Background
A CDN caches responses at the edge, close to users. Your origin server tells
it (and every browser) what to do, using response headers:

| Directive | Meaning |
|-----------|---------|
| `max-age=N` | anyone may reuse this for N seconds without asking |
| `s-maxage=N` | like `max-age`, but only for **shared** caches (CDNs); overrides `max-age` there |
| `public` / `private` | `private` = only the user's own browser may cache it, never a CDN |
| `no-cache` | may be stored, but must be **revalidated** before every use |
| `no-store` | never store it anywhere |
| `immutable` | the content at this URL will never change, so don't even revalidate |

**Revalidation:** the server sends `ETag: "abc"`. Next time, the client sends
`If-None-Match: "abc"`. If nothing changed, the server replies
**`304 Not Modified`** with no body, which is cheap and still guaranteed fresh.

**Fingerprinted assets** (`app.3f9a1c.js`) get a new URL whenever they change,
so you can cache them forever. The HTML that points to them must stay fresh.

## Scenario
`server.js` serves a page, a fingerprinted script, a public product list and
the signed-in user's data. None of them have caching headers.

## Goal
Edit `server.js` so that:
1. `/assets/app.3f9a1c.js` → `Cache-Control: public, max-age=31536000, immutable`
2. `/` → `Cache-Control: no-cache`, plus an `ETag`; reply `304` when `If-None-Match` matches.
3. `/api/products` → `Cache-Control: public, max-age=0, s-maxage=60`, plus an
   `ETag` derived from the content; reply `304` (empty body) when
   `If-None-Match` matches, and `200` otherwise.
4. `/api/me` → `Cache-Control: private, no-store`

## Try it
```bash
npm start      # in another terminal
curl -i localhost:3000/api/products
curl -i localhost:3000/api/products -H 'If-None-Match: "<the etag you got>"'
```

## Hints
- `fingerprint(body)` at the bottom of `server.js` gives you a stable hash.
  Wrap it in quotes: `` `"${fingerprint(body)}"` ``.
- Request headers are lower-case in Node: `req.headers['if-none-match']`.
- A `304` should still send the `ETag` and `Cache-Control`, but not the body.

## Check your work
```
./onboard validate data/04
```
