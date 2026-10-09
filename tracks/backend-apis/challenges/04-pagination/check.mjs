import { readFileSync } from 'node:fs';
import path from 'node:path';
import { check, expect, expectEqual, fromSandbox, SANDBOX, watchdog } from '../../../../lib/checks.mjs';
import { listen, request } from '../../http-checks.mjs';

watchdog();
const { offsetPage, cursorPage } = await fromSandbox('./pagination.js');
const { createPosts, publish, remove } = await fromSandbox('./posts.js');
const ids = (page) => page.items.map((p) => p.id);
const range = (from, to) => Array.from({ length: from - to + 1 }, (_, i) => from - i); // from..to, descending

await check('offsetPage: first page, a middle page and the last page', () => {
  const rows = createPosts();
  const p1 = offsetPage(rows, { limit: 5, offset: 0 });
  expectEqual([ids(p1), p1.nextOffset], [range(25, 21), 5], 'offset 0: ');
  const p2 = offsetPage(rows, { limit: 5, offset: 10 });
  expectEqual([ids(p2), p2.nextOffset], [range(15, 11), 15], 'offset 10: ');
  const last = offsetPage(rows, { limit: 10, offset: 20 });
  expectEqual([ids(last), last.nextOffset], [range(5, 1), null], 'offset 20 (last page): ');
});

// Follow nextCursor until it runs out, optionally changing the data after page 1.
function walk(rows, limit, afterFirstPage = () => {}) {
  const seen = [];
  let cursor;
  for (let i = 0; i < 50; i++) {
    const page = cursorPage(rows, { limit, cursor });
    seen.push(...ids(page));
    if (i === 0) afterFirstPage(rows, page);
    if (page.nextCursor == null) return seen;
    cursor = page.nextCursor;
  }
  throw new Error('nextCursor never became null');
}

await check('cursorPage: walking every page visits all 25 posts once, in order', () => {
  expectEqual(walk(createPosts(), 7), range(25, 1));
});
await check('cursorPage: the cursor is an opaque string, not a bare id', () => {
  const { nextCursor } = cursorPage(createPosts(), { limit: 5 });
  expect(typeof nextCursor === 'string', `nextCursor is ${JSON.stringify(nextCursor)}`);
  expect(!/^\d+$/.test(nextCursor), `"${nextCursor}" is just the id, encode it (base64url JSON)`);
});
await check('cursorPage: a garbage cursor throws an error with status 400', () => {
  let err;
  try { cursorPage(createPosts(), { limit: 5, cursor: '%%not-a-cursor%%' }); } catch (e) { err = e; }
  expect(err, 'no error was thrown');
  expectEqual(err.status, 400, 'err.status: ');
});
await check('cursorPage: a post published mid-read causes no duplicates', () => {
  expectEqual(walk(createPosts(), 5, (rows) => publish(rows, 'new')), range(25, 1));
});
await check('cursorPage: deletes mid-read skip nothing (even deleting the cursor\'s own row)', () => {
  const seen = walk(createPosts(), 5, (rows, page) => {
    remove(rows, 23);                       // a row you already saw
    remove(rows, page.items.at(-1).id);     // the very row the cursor points at
  });
  expectEqual(seen, range(25, 1));
});

// The scenario from demo.js, computed here with the learner's own offsetPage.
function offsetAfter(change) {
  const rows = createPosts();
  const p1 = offsetPage(rows, { limit: 5, offset: 0 });
  change(rows);
  const p2 = offsetPage(rows, { limit: 5, offset: p1.nextOffset });
  return [ids(p1), ids(p2)];
}
const answers = (() => {
  try { return JSON.parse(readFileSync(path.join(SANDBOX, 'answers.json'), 'utf8')); } catch { return {}; }
})();
await check('answers.json: which post did offset pagination show TWICE after a publish?', () => {
  const [a, b] = offsetAfter((rows) => publish(rows, 'new'));
  const dup = b.find((id) => a.includes(id));
  expect(dup !== undefined, 'your offsetPage didn\'t produce a duplicate: check it first');
  expectEqual(answers.offset_after_publish_duplicated_id, dup);
});
await check('answers.json: which post did offset pagination SKIP after a delete?', () => {
  const [a, b] = offsetAfter((rows) => remove(rows, 23));
  const skipped = range(25, 1).find((id) => id !== 23 && id > Math.min(...b) && !a.includes(id) && !b.includes(id));
  expect(skipped !== undefined, 'your offsetPage didn\'t skip anything: check it first');
  expectEqual(answers.offset_after_delete_skipped_id, skipped);
});

const { createApp } = await fromSandbox('./app.js');
const api = await listen(createApp());
await check('HTTP: GET /posts?limit=5&offset=5 returns posts 20..16', async () => {
  const r = await request(`${api.url}/posts?limit=5&offset=5`);
  expectEqual([r.status, r.body?.items?.map((p) => p.id)], [200, range(20, 16)]);
});
await check('HTTP: GET /posts/feed follows nextCursor; a bad cursor is a 400', async () => {
  const p1 = await request(`${api.url}/posts/feed?limit=3`);
  const p2 = await request(`${api.url}/posts/feed?limit=3&cursor=${encodeURIComponent(p1.body?.nextCursor)}`);
  expectEqual(p2.body?.items?.map((p) => p.id), range(22, 20), 'page 2: ');
  const bad = await request(`${api.url}/posts/feed?cursor=nope!!`);
  expectEqual(bad.status, 400, 'bad cursor status: ');
});
await api.close();
