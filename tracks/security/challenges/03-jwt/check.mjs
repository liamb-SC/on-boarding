import { check, expect, fromSandbox, watchdog } from '../../../../lib/checks.mjs';
import { expectStatus, listen } from '../../security-checks.mjs';

watchdog();
const { default: jwt } = await fromSandbox('jsonwebtoken');
const { issueToken, verifyToken, JWT_SECRET, ISSUER, AUDIENCE } = await fromSandbox('./auth.js');
const { users } = await fromSandbox('./users.js');
const alice = users[0];

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = () => Math.floor(Date.now() / 1000);
const claims = (extra = {}) => ({ sub: alice.id, name: alice.name, role: alice.role, iss: ISSUER, aud: AUDIENCE, iat: now(), exp: now() + 900, ...extra });
const rejects = (token, what) => {
  let payload;
  try { payload = verifyToken(token); } catch { return; }
  throw new Error(`verifyToken accepted ${what} (returned ${JSON.stringify(payload)})`);
};

let token, decoded;
await check('issueToken returns a JWT', () => {
  token = issueToken(alice);
  decoded = jwt.decode(token, { complete: true });
  expect(decoded, `not a JWT: ${token}`);
});
await check('it is signed with HS256', () => expect(decoded?.header.alg === 'HS256', `alg is ${decoded?.header.alg}`));
await check('sub is the user id, and it carries name + role', () => {
  const p = decoded?.payload ?? {};
  expect(p.sub === alice.id && p.name === alice.name && p.role === alice.role, `payload: ${JSON.stringify(p)}`);
});
await check('the password is NOT in the token (anyone can base64-decode a JWT)', () =>
  expect(!JSON.stringify(decoded?.payload ?? {}).includes(alice.password), 'the payload contains the password'));
await check('it expires after 15 minutes (exp - iat = 900)', () => {
  const p = decoded?.payload ?? {};
  expect(p.exp - p.iat === 900, `exp=${p.exp} iat=${p.iat}`);
});
await check(`it has iss "${ISSUER}" and aud "${AUDIENCE}"`, () => {
  const p = decoded?.payload ?? {};
  expect(p.iss === ISSUER && p.aud === AUDIENCE, `iss=${p.iss} aud=${p.aud}`);
});

await check('verifyToken accepts a fresh token and returns its payload', () => {
  const p = verifyToken(token);
  expect(p?.sub === alice.id, `returned ${JSON.stringify(p)}`);
});
await check('verifyToken rejects a tampered payload (sub changed, signature kept)', () => {
  const [h, , s] = token.split('.');
  rejects(`${h}.${b64({ ...decoded.payload, sub: '2', role: 'admin' })}.${s}`, 'an edited payload');
});
await check('verifyToken rejects alg "none" (unsigned) tokens', () =>
  rejects(`${b64({ alg: 'none', typ: 'JWT' })}.${b64(claims())}.`, 'an unsigned token'));
await check('verifyToken only accepts HS256 (pins algorithms)', () =>
  rejects(jwt.sign(claims(), JWT_SECRET, { algorithm: 'HS512' }), 'an HS512 token'));
await check('verifyToken rejects a token signed with another secret', () =>
  rejects(jwt.sign(claims(), 'some-other-secret-some-other-secret'), 'a token with the wrong signature'));
await check('verifyToken rejects an expired token', () =>
  rejects(jwt.sign(claims({ iat: now() - 1000, exp: now() - 100 }), JWT_SECRET), 'an expired token'));
await check('verifyToken rejects a token meant for another audience', () =>
  rejects(jwt.sign(claims({ aud: 'billing-service' }), JWT_SECRET), 'aud "billing-service"'));
await check('verifyToken rejects a token from another issuer', () =>
  rejects(jwt.sign(claims({ iss: 'evil-issuer' }), JWT_SECRET), 'iss "evil-issuer"'));

let server;
const started = await check('app.js exports createApp() and the app starts', async () => {
  const { createApp } = await fromSandbox('./app.js');
  server = await listen(createApp());
});
if (started) {
  const me = (t) => fetch(`${server.url}/me`, { headers: t ? { authorization: `Bearer ${t}` } : {} });
  await check('POST /login then GET /me with the Bearer token -> 200 Alice', async () => {
    const res = await fetch(`${server.url}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: alice.password }),
    });
    const { accessToken } = await res.json();
    const r = await me(accessToken);
    expectStatus(r, 200, 'GET /me: ');
    expect((await r.json()).name === 'Alice', 'wrong user');
  });
  await check('GET /me with a forged "admin" token -> 401', async () =>
    expectStatus(await me(`${b64({ alg: 'none' })}.${b64(claims({ sub: '2' }))}.`), 401));
  await server.close();
}
