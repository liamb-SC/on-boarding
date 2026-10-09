# 06 · Secrets out of the code

**Skills:** environment variables, `.env` + `dotenv`, `.env.example`,
`.gitignore`, failing fast on missing config, writing a gitleaks-style
secret scanner, why leaked secrets must be rotated.

## Background
Anything committed to git is effectively public: every clone, fork, CI log
and laptop backup has it, *forever*, even after you delete the line.
Bots scrape GitHub for keys within minutes of a push.

- **Config lives in the environment** ([12-factor](https://12factor.net/config)).
  Code reads `process.env.STRIPE_SECRET_KEY`. Production sets it from a secret
  manager (AWS Secrets Manager, Vault, your CI's secrets).
- Locally, a **`.env`** file holds the values and `dotenv` loads it. `.env` is
  **git-ignored**. A committed **`.env.example`** lists the variable *names*
  so new developers know what to set.
- **Fail fast:** if a required variable is missing, crash at startup with a
  clear message, not with `undefined` at 3am on the first payment.
- **Scanners** like [gitleaks](https://github.com/gitleaks/gitleaks) and
  trufflehog run in pre-commit hooks and CI to catch leaks before they ship.
  They're mostly a list of regexes for known key formats plus a few generic
  rules.
- Removing a leaked secret from the latest commit **does not un-leak it**.
  It's still in history. The fix is to **rotate** it (issue a new key and
  revoke the old one). Rewriting history is optional clean-up, not the fix.

## Scenario
`payments-service` has a database password, a Stripe live key and a JWT
secret hard-coded in `config.js`. `scripts/scan-secrets.mjs` is a skeleton.

## Goal
1. Move the three values into a `.env` file as `DATABASE_URL`,
   `STRIPE_SECRET_KEY` and `JWT_SECRET`, and git-ignore `.env`.
2. Commit a `.env.example` with the same names and no values.
3. Rewrite `config.js` to load `.env` and read `process.env`. Keep the
   exported `config` object's shape (`port` may default to `4242`). If any
   required variable is missing, throw **one** error naming all the missing ones.
4. Finish `scripts/scan-secrets.mjs`: scan every tracked file, print
   `<file>:<line> <rule-id>` per finding, exit `1` if anything was found and
   `0` if not. Rules for Stripe live keys, AWS access key ids, private key
   blocks, and generic `password/secret/api_key/token = "literal"` assignments.
5. `npm run scan` passes on your repo. Commit everything.

## Try it
```bash
npm run scan        # should find the hard-coded secrets in config.js first
npm start
mv .env .env.bak && npm start; mv .env.bak .env     # should fail with a clear message
git log -p -- config.js | head -20                  # ...and the old secrets are still in history
```

## Hints
- `import 'dotenv/config'` at the top of `config.js` loads `.env` from the
  current directory and never overrides variables that are already set.
- `['A', 'B'].filter((k) => !process.env[k])` gives you the missing list.
- Test each rule on one line at a time. Making the generic rule require a
  *quoted literal* keeps `password = process.env.DB_PASSWORD` from matching.
- Real scanners also check entropy and keep an allowlist for false positives.

## Check your work
```
./onboard validate security/06
```
