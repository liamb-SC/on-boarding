// A toy web application firewall (WAF) and rate limiter. Real ones (AWS WAF,
// Cloudflare, ModSecurity) sit in front of your app and work the same way:
// match requests against rules, block the bad ones, throttle the noisy ones.

// TODO 1: each rule is { id, pattern }. Add:
//   sqli            classic SQL injection: ' OR 1=1, UNION SELECT, ; DROP TABLE
//   path-traversal  ../ or ..\ (also when URL-encoded, e.g. ..%2F)
//   xss             <script
// Careful with false positives: "O'Brien" or "select a plan" must get through.
export const RULES = [];

// waf() — middleware. Check the decoded path and every query string value
// against RULES. On a match: 403 { error: 'blocked', rule: <rule id> }.
export function waf() {
  return (req, res, next) => {
    // TODO 2: build the list of strings to inspect (decodeURIComponent the raw
    // path from req.originalUrl, plus Object.values(req.query)) and test them.
    next();
  };
}

// createRateLimiter({ limit, windowMs, now, key }) — fixed-window rate limiting.
//   limit     requests allowed per window, per client
//   windowMs  window length in ms
//   now       clock function (default Date.now; tests pass a fake one)
//   key       req -> client id (default req.ip)
// Over the limit: 429 { error: 'too many requests' } with a Retry-After header
// (whole seconds until this client's window resets, rounded up).
export function createRateLimiter({ limit, windowMs, now = Date.now, key = (req) => req.ip }) {
  // TODO 3: e.g. a Map of client id -> { windowStart, count }
  return (req, res, next) => next();
}
