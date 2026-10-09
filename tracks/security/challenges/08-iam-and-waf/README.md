# 08 · Least-privilege IAM and a WAF-style firewall

**Skills:** IAM policy JSON (`Effect`, `Action`, `Resource`, `Condition`),
least privilege, S3 ARNs, WAF rules and their false positives, rate limiting
(429 + `Retry-After`).

## Background
**IAM** (AWS Identity and Access Management) decides what an identity (a
user, or a role your service runs as) may do. A policy is a list of
statements:

```json
{ "Sid": "ReadReports", "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::my-bucket/reports/*",
  "Condition": { "StringLike": { "s3:prefix": ["reports/*"] } } }
```

- Everything is **denied by default**. An explicit `Deny` beats any `Allow`.
- **Least privilege:** grant the exact actions on the exact resources the
  workload needs. `"Action": "s3:*", "Resource": "*"` means a bug or a stolen
  credential can read, overwrite or delete *every bucket in the account*.
- S3 has two kinds of resource: the **bucket** (`arn:aws:s3:::bucket`, for
  `s3:ListBucket`) and **objects** (`arn:aws:s3:::bucket/key`, for
  `Get/PutObject`). To limit listing to a folder, use the `s3:prefix`
  condition key.
- Watch out for wildcards in the wrong place: `arn:aws:s3:::acme-reports*`
  also matches a bucket called `acme-reports-backup`.

A **WAF** (web application firewall, e.g. AWS WAF, Cloudflare) sits in front
of your app, matches requests against rules (SQL injection, path traversal,
XSS signatures, bad IPs) and blocks them. It also does **rate-based rules**:
too many requests from one client and you get `429 Too Many Requests`. A WAF
is a safety net, not a fix. Parameterised queries and output escaping are the
real defence, and over-eager rules block real customers named O'Brien.

## Scenario
The `report-uploader` service runs with a "works on my machine" policy
(`s3:*` on `*`). Its Express app has an empty WAF and a do-nothing rate limiter.

## Goal
1. Rewrite `iam/policy.json` so the service can **only**:
   - `s3:PutObject` and `s3:GetObject` on objects under `uploads/` in bucket `acme-reports`
   - `s3:ListBucket` on `acme-reports`, only for prefixes under `uploads/`

   No wildcard actions, no `"Resource": "*"`, no `NotAction`, a `Sid` on each statement.
2. `waf.js`: add the `sqli`, `path-traversal` and `xss` rules and implement
   `waf()` (403 `{ "error": "blocked", "rule": "<id>" }`). Normal input like
   `O'Brien` and `select a plan` must still get through.
3. `waf.js`: implement `createRateLimiter` (fixed window per client, 429 with
   `Retry-After` in whole seconds).
4. `app.js`: apply the rate limiter (100 per minute) and the WAF to every route.

The validator evaluates your policy against a list of allowed and forbidden
requests, using a small IAM evaluator that supports `StringLike` and `StringEquals`.

## Try it
```bash
npm start
curl -s "localhost:3000/search?q=1%20UNION%20SELECT%20password%20FROM%20users"
curl -s "localhost:3000/search?q=O'Brien"
for i in $(seq 1 105); do curl -s -o /dev/null -w '%{http_code} ' localhost:3000/search; done
```
In a real AWS account, IAM Access Analyzer's *policy validation* and the
*IAM policy simulator* do what the validator does here.

## Hints
- Two statements: one for objects (`.../uploads/*`), one for the bucket ARN
  with `"Condition": { "StringLike": { "s3:prefix": ["uploads/*"] } }`.
- Express decodes query values for you, but not the raw path:
  `decodeURIComponent(req.originalUrl.split('?')[0])` (wrap it in a try, since
  malformed `%` sequences throw).
- For SQLi, look for *structure*: a quote followed by `OR`/`AND` and a
  comparison, `UNION SELECT`, `; DROP TABLE`. A lone apostrophe isn't an attack.
- `Retry-After` = `Math.ceil((windowStart + windowMs - now()) / 1000)`.

## Check your work
```
./onboard validate security/08
```
