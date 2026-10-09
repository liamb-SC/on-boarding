import { check, expect, fromSandbox, watchdog } from '../../../../lib/checks.mjs';
import { listen } from '../../security-checks.mjs';

watchdog();
const { can } = await fromSandbox('./rbac.js');

const role = (r) => ({ id: 'x', role: r });
const expectCan = (user, perm, want) => {
  let got;
  try { got = can(user, perm); } catch (e) { throw new Error(`can(${JSON.stringify(user)}, '${perm}') threw: ${e.message}`); }
  expect(got === want, `can(${JSON.stringify(user)}, '${perm}') returned ${got}, expected ${want}`);
};

await check('can(): viewers read but don\'t write', () => {
  expectCan(role('viewer'), 'posts:read', true);
  expectCan(role('viewer'), 'posts:create', false);
});
await check('can(): editors create and update, but don\'t delete or update:any', () => {
  for (const p of ['posts:read', 'posts:create', 'posts:update']) expectCan(role('editor'), p, true);
  for (const p of ['posts:delete', 'posts:update:any', 'users:manage']) expectCan(role('editor'), p, false);
});
await check('can(): admins have every permission in the table', () => {
  for (const p of ['posts:read', 'posts:create', 'posts:update', 'posts:update:any', 'posts:delete', 'users:manage']) expectCan(role('admin'), p, true);
});
await check('can(): deny by default (no user, unknown role, unknown permission)', () => {
  expectCan(undefined, 'posts:read', false);
  expectCan(role('superuser'), 'posts:read', false);
  expectCan(role('admin'), 'billing:refund', false);
});
await check('can(): a role named "constructor" or "__proto__" grants nothing (and doesn\'t crash)', () => {
  expectCan(role('constructor'), 'posts:read', false);
  expectCan(role('__proto__'), 'posts:read', false);
});

let server;
const started = await check('app.js exports createApp() and the app starts', async () => {
  const { createApp } = await fromSandbox('./app.js');
  server = await listen(createApp());
});
if (!started) process.exit(1);

const call = async (method, path, who, body) => {
  const headers = { 'content-type': 'application/json' };
  if (who) headers.authorization = `Bearer ${who}-token`;
  return (await fetch(server.url + path, { method, headers, body: body && JSON.stringify(body) })).status;
};
// [description, method, path, who, expected status]
const matrix = [
  ['anonymous GET /posts -> 401', 'GET', '/posts', null, 401],
  ['viewer GET /posts -> 200', 'GET', '/posts', 'viewer', 200],
  ['viewer POST /posts -> 403', 'POST', '/posts', 'viewer', 403],
  ['editor POST /posts -> 201', 'POST', '/posts', 'editor', 201],
  ['anonymous POST /posts -> 401 (not 500)', 'POST', '/posts', null, 401],
  ['editor PUT their own post p1 -> 200', 'PUT', '/posts/p1', 'editor', 200],
  ['editor PUT someone else\'s post p2 -> 403', 'PUT', '/posts/p2', 'editor', 403],
  ['viewer PUT /posts/p1 -> 403', 'PUT', '/posts/p1', 'viewer', 403],
  ['admin PUT anyone\'s post p2 -> 200', 'PUT', '/posts/p2', 'admin', 200],
  ['editor DELETE /posts/p1 -> 403', 'DELETE', '/posts/p1', 'editor', 403],
  ['admin DELETE /posts/p1 -> 204', 'DELETE', '/posts/p1', 'admin', 204],
  ['editor GET /admin/users -> 403', 'GET', '/admin/users', 'editor', 403],
  ['admin GET /admin/users -> 200', 'GET', '/admin/users', 'admin', 200],
  ['anonymous GET /admin/users -> 401', 'GET', '/admin/users', null, 401],
];
for (const [desc, method, path, who, want] of matrix) {
  await check(desc, async () => {
    const got = await call(method, path, who, ['PUT', 'POST'].includes(method) ? { title: 'Edited' } : undefined);
    expect(got === want, `got ${got}`);
  });
}

await server.close();
