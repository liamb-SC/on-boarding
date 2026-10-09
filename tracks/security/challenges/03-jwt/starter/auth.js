import jwt from 'jsonwebtoken';

// In real life this comes from the environment (see challenge 06).
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-0f6c2a8e5b7d4c19a3e1f0b2d4c6e8a7';
export const ISSUER = 'stepchange-api';
export const AUDIENCE = 'stepchange-web';

// issueToken(user) -> a signed access token for this user.
// TODO 1: this signs the WHOLE user object (password included!) and the token
// never expires. Sign only what clients need: { name, role }, with the user id
// as the subject, and HS256 / 15 minute expiry / ISSUER / AUDIENCE.
export function issueToken(user) {
  return jwt.sign(user, JWT_SECRET);
}

// verifyToken(token) -> the token's payload, or THROWS if the token is not
// valid. Callers rely on the throw.
// TODO 2: jwt.decode just base64-decodes. It checks nothing: anyone can edit
// the payload, strip the signature, or use an expired token.
export function verifyToken(token) {
  const payload = jwt.decode(token);
  if (!payload) throw new Error('malformed token');
  return payload;
}
