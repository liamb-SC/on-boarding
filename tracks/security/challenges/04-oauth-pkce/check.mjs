import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, fromSandbox, stage, watchdog } from '../../../../lib/checks.mjs';
import { client, listen } from '../../security-checks.mjs';

watchdog();
// The validator talks to its own copy of the mock server, not the sandbox's.
const mock = stage(path.resolve(fileURLToPath(import.meta.url), '../mock'), 'oauth-mock');
const { createAuthServer } = await fromSandbox(`${mock}/auth-server.js`);
const { createVerifier, challengeFor } = await fromSandbox('./pkce.js');

await check('challengeFor matches the RFC 7636 test vector', () => {
  const got = challengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
  expect(got === 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', `got ${got}`);
});
await check('createVerifier returns 43-128 unreserved characters', () => {
  const v = createVerifier();
  expect(/^[A-Za-z0-9\-._~]{43,128}$/.test(v ?? ''), `got ${JSON.stringify(v)}`);
});
await check('createVerifier is random (two calls differ)', () => expect(createVerifier() !== createVerifier(), 'got the same verifier twice'));

const authApp = createAuthServer();
const as = await listen(authApp);

// Start the client on a port first, so we know its redirect_uri.
let handler = (req, res) => res.end();
const http = createServer((req, res) => handler(req, res));
await new Promise((r) => http.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${http.address().port}`;
const redirectUri = `${base}/callback`;
const started = await check('app.js exports createApp({ authServerUrl, redirectUri })', async () => {
  const { createApp } = await fromSandbox('./app.js');
  handler = createApp({ authServerUrl: as.url, redirectUri });
});
if (!started) process.exit(1);

// Walk one browser through /login -> authorization server -> /callback.
async function startLogin(browser) {
  const res = await browser.request('/login');
  expect(res.status === 302, `GET /login returned ${res.status}, expected a 302 redirect`);
  const authorize = new URL(res.headers.get('location'));
  const back = await fetch(authorize, { redirect: 'manual' });
  expect(back.status === 302, `the authorization server answered ${back.status}: ${await back.text()}`);
  return { authorize, callback: new URL(back.headers.get('location')) };
}

const alice = client(base);
let flow;
await check('/login redirects to the authorization server\'s /authorize', async () => {
  flow = await startLogin(alice);
  expect(flow.authorize.href.startsWith(`${as.url}/authorize`), `redirected to ${flow.authorize.href}`);
});
const p = flow?.authorize.searchParams ?? new URLSearchParams();
await check('...with response_type=code, client_id=notes-app and the redirect_uri', () => {
  expect(p.get('response_type') === 'code', `response_type=${p.get('response_type')}`);
  expect(p.get('client_id') === 'notes-app', `client_id=${p.get('client_id')}`);
  expect(p.get('redirect_uri') === redirectUri, `redirect_uri=${p.get('redirect_uri')}`);
});
await check('...with a random state (16+ characters)', () => expect((p.get('state') ?? '').length >= 16, `state=${p.get('state')}`));
await check('...with an S256 code_challenge', () => {
  expect(p.get('code_challenge_method') === 'S256', `code_challenge_method=${p.get('code_challenge_method')}`);
  expect(/^[A-Za-z0-9_-]{43}$/.test(p.get('code_challenge') ?? ''), `code_challenge=${p.get('code_challenge')}`);
});
await check('the authorization server approved and returned a code + your state', () => {
  const cb = flow?.callback;
  expect(cb?.searchParams.get('code'), `came back with ${cb?.search}`);
  expect(cb.searchParams.get('state') === p.get('state'), 'state mismatch');
});

await check('/callback exchanges the code (PKCE verified) and redirects to /me', async () => {
  expect(flow, 'the /login step above failed');
  const callbackRes = await alice.request(flow.callback.pathname + flow.callback.search);
  expect(callbackRes.status === 302, `GET /callback returned ${callbackRes.status}: ${(await callbackRes.text()).slice(0, 120)}`);
  expect(!authApp.locals.codes.has(flow.callback.searchParams.get('code')), 'the code was never redeemed at /token');
});
await check('GET /me now returns alice from /userinfo', async () => {
  const me = await alice.request('/me');
  const body = await me.json();
  expect(me.status === 200 && body.sub === 'alice', `GET /me: ${me.status} ${JSON.stringify(body)}`);
});
await check('replaying the same callback URL fails (400)', async () => {
  expect(flow, 'the /login step above failed');
  const again = await alice.request(flow.callback.pathname + flow.callback.search);
  expect(again.status === 400, `got ${again.status}`);
});

await check('a callback whose state doesn\'t match is rejected (400) before redeeming the code', async () => {
  const bob = client(base);
  const { callback } = await startLogin(bob);
  callback.searchParams.set('state', 'attacker-chosen-state-value');
  const res = await bob.request(callback.pathname + callback.search);
  expect(res.status === 400, `got ${res.status}`);
  expect(authApp.locals.codes.has(callback.searchParams.get('code')), 'the code was sent to /token anyway');
});
await check('a callback with no login in progress (no session) is rejected (400)', async () => {
  const res = await client(base).request('/callback?code=abc&state=def');
  expect(res.status === 400, `got ${res.status}`);
});
await check('?error=access_denied from the server -> 400', async () => {
  const carol = client(base);
  const { authorize } = await startLogin(carol);
  const res = await carol.request(`/callback?error=access_denied&state=${authorize.searchParams.get('state')}`);
  expect(res.status === 400, `got ${res.status}`);
});

http.closeAllConnections();
http.close();
await as.close();
