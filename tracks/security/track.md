# Track: Security

Web application security for Node/Express developers: the classic browser
attacks and their defences, authentication and authorization, secrets and
cryptography, and a taste of cloud-side controls. Each challenge is a small,
deliberately vulnerable app for you to fix.

## Requirements
Node.js 20+ and network access to the npm registry. Most challenges' setup
installs `express` plus one or two focused packages (`helmet`, `cors`,
`express-session`, `jsonwebtoken`, `dotenv`). 07 uses only `node:crypto`.
No cloud account needed.

## Learning objectives
By the end you can:
- Prevent XSS with output escaping, and back it up with a Content-Security-Policy and `helmet`.
- Explain the difference between CSRF and CORS, and defend against CSRF with tokens and `SameSite` cookies.
- Configure CORS with an exact allowlist, credentials and preflight.
- Issue and verify JWTs safely: expiry, issuer/audience, pinned algorithms.
- Implement the OAuth 2.0 authorization code flow with PKCE and `state`.
- Write role/permission middleware with deny-by-default and ownership checks.
- Keep secrets out of git, fail fast on missing config, and scan for leaks.
- Use AES-256-GCM correctly, hash passwords with scrypt, and explain what TLS gives you.
- Write a least-privilege IAM policy, and describe what a WAF and a rate limiter do.

## Challenges (do them in order)
| # | Challenge | Core concepts |
|---|-----------|---------------|
| 01 | xss-csp-helmet | stored/reflected XSS, HTML escaping, `helmet`, CSP `script-src 'self'` |
| 02 | csrf-and-cors | CSRF tokens, `timingSafeEqual`, `SameSite`/`HttpOnly`, CORS allowlist, preflight |
| 03 | jwt | `sign`/`verify`, `exp`/`iss`/`aud`/`sub`, `alg: none`, pinning algorithms |
| 04 | oauth-pkce | authorization code flow, PKCE S256, `state`, token endpoint (local mock server) |
| 05 | rbac | roles → permissions, `requirePermission`, 401 vs 403, ownership |
| 06 | secrets | `.env` + `dotenv`, `.env.example`, fail fast, a gitleaks-style scanner, rotation |
| 07 | encryption | AES-256-GCM at rest, scrypt password hashing, TLS quiz |
| 08 | iam-and-waf | least-privilege IAM policy JSON, WAF rules, rate limiting |

Every Express sandbox has `npm start` (on `:3000`) so you can poke at it with
`curl` or a browser. 04 also has `npm run auth-server` (on `:9000`).

Start with: `./onboard start security/01`
