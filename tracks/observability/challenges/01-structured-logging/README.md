# 01 · Structured logs with pino

**Skills:** JSON logs, log levels and `LOG_LEVEL`, fields vs string-building,
child loggers, correlation (request) IDs, logging errors properly, redaction.

## Background
`console.log('order ' + id + ' placed')` is fine on your laptop and useless
across 40 pods. **Structured logs** are one JSON object per line, so a log
platform (CloudWatch, Datadog, Loki...) can filter and aggregate on fields:
```js
logger.info({ orderId, total }, 'order placed');
// {"level":30,"time":...,"service":"checkout","requestId":"9f1c...","orderId":"ord_1000","total":2498,"msg":"order placed"}
```
- Keep **`msg` a fixed string** and put values in fields. Then "how many
  `order placed` per minute?" is a simple query.
- **Levels:** `debug` < `info` < `warn` < `error`. Production usually runs at
  `info`. Turning on `debug` for an incident should be a config change
  (`LOG_LEVEL=debug`), not a deploy.
- **Correlation IDs:** give every request an ID, reuse the caller's
  `x-request-id` if there is one, put it on every log line, and send it back.
  Then one search finds everything that happened to one request, across
  services. `logger.child({ requestId })` adds it to every line for you.
- **Errors:** log the `Error` object as `{ err }`. pino serialises its type,
  message and stack. `'failed: ' + err.message` throws the stack away.
- **Never log secrets or card numbers.** pino's `redact` option is a safety net.

## Scenario
`checkout.js` handles "place an order" and debugs with `console.log`. That
includes dumping the whole request body, card number and all.

## Goal
1. `logger.js`: `createLogger(destination)` returns a pino logger writing to
   `destination` with its level from `LOG_LEVEL` (default `info`),
   `service: 'checkout'` on every line, and `card.number` redacted.
2. `checkout.js`: replace every `console.log`:
   - use the `x-request-id` header, or a new `randomUUID()`, as `requestId`.
     Log through a **child logger** that carries it, and return it in the
     response's `x-request-id` header on **every** response.
   - `debug` when starting (e.g. `{ itemCount }`, never the card)
   - `warn` when rejecting an empty cart
   - `info` `'order placed'` with `orderId` and `total` as fields
   - `error` `'payment failed'` with the error as `err`

## Try it
```bash
npm start                         # three sample requests
LOG_LEVEL=debug npm start
npm start | npx pino-pretty       # human-friendly view for local dev
npm start | grep req-from-the-gateway   # everything for one request
```

## Hints
- `pino(options, destination)`: the options you need are `level`, `base` and
  `redact` ([docs](https://getpino.io/#/docs/api?id=options)).
- `const log = logger.child({ requestId })`, then use `log` everywhere below it.

## Check your work
```
./onboard validate observability/01
```
