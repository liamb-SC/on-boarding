import { createHash, randomBytes } from 'node:crypto';

// PKCE (RFC 7636) in two functions.

// createVerifier() — a fresh, high-entropy code_verifier: 43-128 characters
// from [A-Z a-z 0-9 - . _ ~]. 32 random bytes as base64url gives exactly 43.
export function createVerifier() {
  // TODO 1
  return 'not-random';
}

// challengeFor(verifier) — the S256 code_challenge:
// BASE64URL( SHA-256( verifier ) ), with no '=' padding.
export function challengeFor(verifier) {
  // TODO 2
  return verifier;
}
