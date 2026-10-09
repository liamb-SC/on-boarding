# 06 · HAR files: read one, record one, sanitise it

**Skills:** the HAR format (`log.entries[].request/response/timings`),
answering "what happened?" from a HAR, recording one from the browser, and
scrubbing secrets before you share it.

## Background
A **HAR** (HTTP Archive) is a JSON log of every request a page made: URL,
method, headers, body, status, response, and **timings** (`blocked`, `dns`,
`connect`, `ssl`, `send`, `wait`, `receive`). `wait` is the time to first
byte, meaning time spent waiting for the server. When someone says "the site's
slow for me", a HAR from their browser shows exactly what happened.

```bash
node -e 'const h=require("./shop-session.har");
  for (const e of h.log.entries) console.log(e.response.status, Math.round(e.time), e.request.url)'
```

HARs are dangerous to share. They hold **everything**: `Authorization` and
`Cookie` headers, `Set-Cookie` responses, passwords in login bodies, tokens in
response bodies and query strings. Anyone with the file can be you until those
expire. Always sanitise a HAR before you attach it to a ticket.

## Scenario
`shop-session.har` is a recording of a slow page load from a customer. The
notes app (`npm start`, then <http://localhost:5055/app>) logs in, loads notes,
and fires an analytics call that puts the token in its URL.

## Goal
**Part 1: read it.** Fill in `answers.json` from `shop-session.har`:
`requestCount`, `slowestPath` (largest `time`), `slowestWaitMs` (that
request's `timings.wait`), `failedPath` (the 5xx), `largestPath` (largest
`response.content.size`), `cookieName` (set at login), and `leaks`: every place
the file exposes a credential, chosen from `request-header`, `request-body`,
`request-url`, `response-header`, `response-body`.

**Part 2: record and sanitise.**
1. `npm start`, open <http://localhost:5055/app> with DevTools' **Network** tab
   open, reload, and export a HAR to `recorded.har` in the sandbox. Make sure
   you get the response contents too (see hints).
2. Make `sanitised.har`: the same recording with **no token** (`sk_test_...`),
   **no session cookie** (`sess_...`) and **no password** left anywhere.
   Redact the values, for example to `"REDACTED"`, rather than deleting whole
   entries, because the URLs, statuses and timings are what make it useful.
3. Add `.gitignore` rules so `recorded.har` can never be committed but
   `sanitised.har` can.

## Hints
- Chrome: the ⤓ **Export HAR** button in the Network toolbar. Newer Chrome
  versions export a *sanitized* HAR by default, without cookies or
  `Authorization`. Is that enough? Search the file for `sk_test_`.
- No GUI browser? `npx playwright open --save-har=recorded.har http://localhost:5055/app`,
  then close the window.
- A Node script is the repeatable way: load the JSON, walk `log.entries`, and
  rewrite headers, `queryString`, `request.url`, `postData.text` and
  `response.content.text`. Or `sed -E 's/sk_test_[0-9a-f]+/REDACTED/g'`, but
  check what that misses.
- In `.gitignore`, `*.har` followed by `!sanitised.har` ignores all HARs except that one.

## Check your work
```
./onboard validate testing/06
```
