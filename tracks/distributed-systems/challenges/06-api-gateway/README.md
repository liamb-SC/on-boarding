# 06 · API gateway: routing, auth and rate limiting

**Skills:** a single entry point, path-based routing, API-key auth at the edge,
per-client rate limiting (`429`, `Retry-After`), request IDs, keeping
credentials away from internal services.

## Background
Clients shouldn't need to know that `/users` and `/orders` are separate
services on separate hosts. An **API gateway** sits in front of them and
handles the cross-cutting concerns once, so each service doesn't have to:

- **Routing**: `/users/*` → users service, `/orders/*` → orders service.
- **Authentication**: reject bad credentials at the edge, then tell the
  service *who* is calling (`x-user`), not *how* they proved it.
- **Rate limiting**: protect the backends from one noisy client. Reply
  `429 Too Many Requests` with `Retry-After`.
- **Request IDs**: tag every request so you can trace it through every service's logs.

Examples: AWS API Gateway, Kong, NGINX, Envoy, Apigee, Azure APIM.

## Scenario
`services.js` has two echo services that show exactly what they received.
`gateway.js` has a `forward()` helper and the steps listed as TODOs.

## Goal
Implement `createGateway` in `gateway.js`, in this order:
1. **Auth**: an unknown or missing `x-api-key` gets `401`.
2. **Rate limit**: at most `limit` requests per key per fixed window of
   `windowMs` (use `now()`). Over the limit gets `429` and `Retry-After` (whole
   seconds until the window resets, rounded up).
3. **Route** by path prefix. No match gets `404`.
4. **Forward** with `x-user`, an `x-request-id` (keep the client's), and no
   `x-api-key`. An unreachable service gets `502`.

## Try it
```bash
npm start
curl -i localhost:8080/users/42 -H 'x-api-key: key-alice'
for i in 1 2 3 4 5 6; do curl -s -o /dev/null -w '%{http_code}\n' localhost:8080/orders -H 'x-api-key: key-bob'; done
```

## Hints
- A fixed window: `const window = Math.floor(now() / windowMs)`. Keep a `Map`
  of key → `{ window, count }`.
- `const headers = { ...req.headers, 'x-user': user, 'x-request-id': ... }`,
  then `delete headers['x-api-key']`. Also drop `host` and `content-length`, and
  let `fetch` set them.
- Wrap `forward(...)` in `try/catch` to turn a connection error into a `502`.

## Check your work
```
./onboard validate distributed-systems/06
```
