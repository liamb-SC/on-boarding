// npm run demo: what happens to each kind of pagination when the data
// changes between page 1 and page 2? Read the output, then fill in answers.json.
import { createPosts, publish, remove } from './posts.js';
import { cursorPage, offsetPage } from './pagination.js';

const ids = (page) => page.items.map((p) => p.id).join(', ');
const LIMIT = 5;

function scenario(title, change) {
  console.log(`\n=== ${title} ===`);

  let rows = createPosts();
  const o1 = offsetPage(rows, { limit: LIMIT, offset: 0 });
  change(rows);
  const o2 = offsetPage(rows, { limit: LIMIT, offset: o1.nextOffset });
  console.log(`offset  page 1: ${ids(o1)}`);
  console.log(`offset  page 2: ${ids(o2)}`);

  rows = createPosts();
  const c1 = cursorPage(rows, { limit: LIMIT });
  change(rows);
  const c2 = cursorPage(rows, { limit: LIMIT, cursor: c1.nextCursor });
  console.log(`cursor  page 1: ${ids(c1)}`);
  console.log(`cursor  page 2: ${ids(c2)}`);
}

scenario('a new post is published while you read page 1', (rows) => publish(rows, 'Breaking news'));
scenario('post #23 is deleted while you read page 1', (rows) => remove(rows, 23));
