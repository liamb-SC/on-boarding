import { check, expect, expectEqual, fromSandbox, watchdog } from '../../../../lib/checks.mjs';
import { cookieJar, listen, request } from '../../http-checks.mjs';

watchdog();
delete process.env.NODE_ENV;
const { createApp } = await fromSandbox('./app.js');
const api = await listen(createApp());
const call = (p, o) => request(api.url + p, o);
const sidCookie = (res) => (res.headers.getSetCookie() ?? []).find((c) => c.startsWith('sid='));

let visitCookie;
await check('the session cookie is called "sid" (not the default connect.sid)', async () => {
  const r = await call('/visit');
  expectEqual(r.status, 200, 'GET /visit status: ');
  visitCookie = sidCookie(r);
  expect(visitCookie, `no sid cookie set, got: ${r.headers.get('set-cookie') ?? 'none'}`);
});
await check('the cookie is HttpOnly (page JavaScript can\'t read it)', () =>
  expect(/;\s*HttpOnly/i.test(visitCookie ?? ''), visitCookie));
await check('the cookie is SameSite=Lax', () =>
  expect(/;\s*SameSite=Lax/i.test(visitCookie ?? ''), visitCookie));
await check('the cookie expires in about an hour (maxAge)', () => {
  const m = /;\s*Expires=([^;]+)/i.exec(visitCookie ?? '');
  expect(m, `no Expires attribute: ${visitCookie}`);
  const mins = (Date.parse(m[1]) - Date.now()) / 60000;
  expect(mins > 55 && mins <= 61, `expires in ${mins.toFixed(0)} minutes`);
});
await check('in development the cookie is NOT Secure (so http://localhost works)', () =>
  expect(visitCookie && !/;\s*Secure/i.test(visitCookie), visitCookie ?? 'no sid cookie'));

await check('GET /me without a session is a 401', async () => {
  expectEqual((await call('/me')).status, 401, 'status: ');
});
await check('POST /login with a wrong password is a 401', async () => {
  const r = await call('/login', { method: 'POST', json: { username: 'ada', password: 'nope' } });
  expectEqual(r.status, 401, 'status: ');
});

const jar = cookieJar();
let before, after;
await check('POST /login with good credentials returns the user', async () => {
  await call('/visit', { jar });
  before = jar.get('sid');
  const r = await call('/login', { jar, method: 'POST', json: { username: 'ada', password: 'lovelace' } });
  expectEqual([r.status, r.body], [200, { id: 1, name: 'Ada Lovelace' }]);
  after = jar.get('sid');
});
await check('login issues a NEW session id (regenerate, against session fixation)', () => {
  expect(before && after, 'no session cookie');
  expect(before !== after, 'the session id did not change on login');
});
await check('GET /me with the new session returns the user', async () => {
  const r = await call('/me', { jar });
  expectEqual([r.status, r.body], [200, { id: 1, name: 'Ada Lovelace' }]);
});
await check('the old pre-login session id does not get you in', async () => {
  const r = await call('/me', { headers: { cookie: `sid=${before}` } });
  expectEqual(r.status, 401, 'status: ');
});
await check('POST /logout is a 204 and clears the sid cookie', async () => {
  const r = await call('/logout', { jar, method: 'POST' });
  expectEqual(r.status, 204, 'status: ');
  const c = sidCookie(r);
  expect(c && /Expires=Thu, 01 Jan 1970/i.test(c), `expected the sid cookie to be cleared, got ${c ?? 'no Set-Cookie'}`);
});
await check('after logout the old session id is dead (destroyed server-side)', async () => {
  const r = await call('/me', { headers: { cookie: `sid=${after}` } });
  expectEqual(r.status, 401, 'status: ');
});
await api.close();

await check('in production the cookie is Secure (behind an HTTPS proxy)', async () => {
  process.env.NODE_ENV = 'production';
  const prod = await listen(createApp());
  try {
    const r = await request(`${prod.url}/visit`, { headers: { 'x-forwarded-proto': 'https' } });
    const c = sidCookie(r);
    expect(c && /;\s*Secure/i.test(c), `got ${c ?? 'no sid cookie'}`);
  } finally {
    await prod.close();
    delete process.env.NODE_ENV;
  }
});
