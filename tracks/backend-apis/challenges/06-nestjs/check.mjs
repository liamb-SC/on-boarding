import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { request } from '../../http-checks.mjs';

watchdog(60000);
const built = await check('the TypeScript compiles (npm run build)', () => {
  rmSync(path.join(SANDBOX, 'dist'), { recursive: true, force: true }); // no stale output
  try {
    execFileSync('npm', ['run', '-s', 'build'], { cwd: SANDBOX, stdio: 'pipe' });
  } catch (e) {
    throw new Error(`${e.stdout}${e.stderr}`.split('\n').filter(Boolean).slice(0, 3).join(' | '));
  }
});
if (!built) process.exit(1);

await fromSandbox('reflect-metadata');
const { NestFactory } = await fromSandbox('@nestjs/core');
const load = async (f) => (existsSync(path.join(SANDBOX, 'dist', f)) ? fromSandbox(`./dist/${f}`) : {});
const { AppModule } = await load('app.module.js');
const { configureApp } = await load('configure.js');
const { TodosModule } = await load('todos/todos.module.js');
const { TodosController } = await load('todos/todos.controller.js');
const { TodosService } = await load('todos/todos.service.js');
const meta = (key, target) => (target ? Reflect.getMetadata(key, target) ?? [] : []);

await check('TodosModule declares TodosController and provides TodosService', () => {
  expect(TodosModule, 'src/todos/todos.module.ts doesn\'t export a TodosModule');
  expect(meta('controllers', TodosModule).includes(TodosController), 'TodosController is not in its controllers');
  expect(meta('providers', TodosModule).includes(TodosService), 'TodosService is not in its providers');
});
await check('AppModule imports TodosModule', () =>
  expect(meta('imports', AppModule).includes(TodosModule), 'AppModule.imports doesn\'t include TodosModule'));
await check('TodosController gets TodosService by constructor injection', () =>
  expect(meta('design:paramtypes', TodosController).includes(TodosService), 'no TodosService constructor parameter'));

let app;
const started = await check('the app boots (NestFactory.create + configureApp)', async () => {
  app = await NestFactory.create(AppModule, { logger: false });
  configureApp(app);
  await app.listen(0, '127.0.0.1');
});
if (!started) process.exit(1);
const url = `http://127.0.0.1:${app.getHttpServer().address().port}`;
const call = (p, o) => request(url + p, o);

await check('GET /todos lists the todos', async () => {
  const r = await call('/todos');
  expectEqual([r.status, r.body], [200, [{ id: 1, title: 'Learn NestJS', done: false }]]);
});
await check('POST /todos creates a todo (201, done defaults to false)', async () => {
  const r = await call('/todos', { method: 'POST', json: { title: 'Write a DTO' } });
  expectEqual([r.status, r.body], [201, { id: 2, title: 'Write a DTO', done: false }]);
});
await check('GET /todos/2 returns the new todo', async () => {
  const r = await call('/todos/2');
  expectEqual([r.status, r.body?.title], [200, 'Write a DTO']);
});
await check('GET /todos/999 is a 404 (NotFoundException)', async () => {
  expectEqual((await call('/todos/1')).status, 200, 'GET /todos/1 status: ');
  expectEqual((await call('/todos/999')).status, 404, 'GET /todos/999 status: ');
});
await check('GET /todos/abc is a 400 (ParseIntPipe)', async () => {
  expectEqual((await call('/todos/abc')).status, 400, 'status: ');
});
await check('the DTO rejects a missing, empty, non-string or too-long title with 400', async () => {
  for (const json of [{}, { title: '' }, { title: 42 }, { title: 'x'.repeat(101) }]) {
    const r = await call('/todos', { method: 'POST', json });
    expect(r.status === 400, `${JSON.stringify(json).slice(0, 40)} got ${r.status}`);
  }
});
await check('the DTO rejects a non-boolean done with 400', async () => {
  expectEqual((await call('/todos', { method: 'POST', json: { title: 'ok', done: 'yes' } })).status, 400, 'status: ');
});
await check('unknown properties are rejected with 400 (forbidNonWhitelisted)', async () => {
  const r = await call('/todos', { method: 'POST', json: { title: 'ok', isAdmin: true } });
  expectEqual(r.status, 400, 'status: ');
});
await check('done: true is accepted', async () => {
  const r = await call('/todos', { method: 'POST', json: { title: 'Ship', done: true } });
  expectEqual([r.status, r.body?.done], [201, true]);
});
await app.close();
