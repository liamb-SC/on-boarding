import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, expect, expectEqual, fromSandbox, stage, SANDBOX, watchdog } from '../../../../lib/checks.mjs';

watchdog();
const ref = stage(path.join(path.dirname(fileURLToPath(import.meta.url)), 'starter'), 'monolith');
const { renderReceipt: originalRender } = await fromSandbox(`${ref}/monolith.js`);
const read = (f) => (existsSync(path.join(SANDBOX, f)) ? readFileSync(path.join(SANDBOX, f), 'utf8') : '');

// ---- Part 1: the decision record -------------------------------------------
const md = read('decision.md').replace(/<!--[\s\S]*?-->/g, '');
const sections = {};
let current = null;
for (const line of md.split('\n')) {
  const h = /^##\s+(.+?)\s*$/.exec(line);
  if (h) { current = h[1].trim().toLowerCase(); sections[current] = ''; } else if (current) sections[current] += `${line}\n`;
}
const words = (s) => (s ?? '').replace(/[|#*_`-]/g, ' ').split(/\s+/).filter((w) => /[a-z]/i.test(w)).length;

for (const name of ['context', 'options', 'decision', 'consequences']) {
  await check(`decision.md: "## ${name[0].toUpperCase() + name.slice(1)}" has real content (25+ words)`, () => {
    expect(name in sections, 'the section heading is missing');
    expect(words(sections[name]) >= 25, `only ${words(sections[name])} words`);
  });
}

const rows = (sections['trade-offs'] ?? '').split('\n').filter((l) => l.trim().startsWith('|'))
  .map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
const header = rows[0]?.map((c) => c.toLowerCase()) ?? [];
const body = rows.slice(1).filter((r) => !r.every((c) => /^:?-*:?$/.test(c)));

await check('decision.md: the Trade-offs table has columns Factor | Monolith | Serverless', () => {
  expectEqual(header.slice(0, 3), ['factor', 'monolith', 'serverless']);
});

await check('decision.md: at least 6 trade-off rows, every cell filled in', () => {
  const full = body.filter((r) => r.length >= 3 && r.slice(0, 3).every((c) => c.length > 0));
  expect(full.length >= 6, `${full.length} complete rows`);
});

for (const [label, re] of [['cold starts', /cold.?start/i], ['cost', /cost|price|pay/i], ['scaling', /scal/i], ['debugging or observability', /debug|observ|tracing|logs|local/i]]) {
  await check(`decision.md: the trade-offs cover ${label}`, () => {
    expect(body.some((r) => re.test(r[0] ?? '')), `add a row whose Factor is about ${label}`);
  });
}

await check('decision.md: the Decision names what you chose', () => {
  expect(/monolith|serverless|lambda|function/i.test(sections.decision ?? ''), 'say which option you picked');
});

// ---- Part 2: split the function out --------------------------------------
const order = { id: 'o9', email: 'grace@example.com', items: [{ name: 'Tea', qty: 3, price: 2.5 }, { name: 'Mug', qty: 1, price: 6 }] };

await check('lib/receipt.js exports renderReceipt, with exactly the same output as before', async () => {
  expect(read('lib/receipt.js'), 'create lib/receipt.js');
  const { renderReceipt } = await fromSandbox('./lib/receipt.js');
  expect(typeof renderReceipt === 'function', 'export function renderReceipt');
  expect(renderReceipt(order) === originalRender(order), `got ${JSON.stringify(renderReceipt(order))}`);
});

await check('monolith.js imports renderReceipt from lib/receipt.js (one copy of the logic)', () => {
  const src = read('monolith.js');
  expect(!/function\s+renderReceipt/.test(src), 'monolith.js still defines renderReceipt itself');
  expect(/from\s+['"]\.\/lib\/receipt\.js['"]/.test(src), "import { renderReceipt } from './lib/receipt.js'");
});

await check('handler.js reuses lib/receipt.js rather than copying it', () => {
  const src = read('functions/send-receipt/handler.js');
  expect(!/function\s+renderReceipt/.test(src) && /from\s+['"](\.\.\/)+lib\/receipt\.js['"]/.test(src), 'import renderReceipt from ../../lib/receipt.js');
});

const { outbox } = await fromSandbox('./lib/mailer.js');
const { handler } = await fromSandbox('./functions/send-receipt/handler.js');
const rec = (messageId, body) => ({ messageId, body: typeof body === 'string' ? body : JSON.stringify(body) });

await check('the monolith still sends receipts at checkout', async () => {
  const { createApp } = await fromSandbox('./monolith.js');
  const server = createApp();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  outbox.length = 0;
  const res = await fetch(`http://127.0.0.1:${server.address().port}/orders`, { method: 'POST', body: JSON.stringify(order) });
  server.close();
  expect(res.status === 201, `POST /orders -> ${res.status}`);
  expect(outbox.length === 1 && outbox[0].text === originalRender(order), 'no (or a wrong) receipt was sent');
});

await check('handler: sends one receipt per SQS record and reports no failures', async () => {
  outbox.length = 0;
  const result = await handler({ Records: [rec('m1', order), rec('m2', { ...order, id: 'o10', email: 'ada@example.com' })] });
  expectEqual(result, { batchItemFailures: [] }, 'return value: ');
  expectEqual(outbox.map((m) => m.to).sort(), ['ada@example.com', 'grace@example.com']);
  expect(outbox.every((m) => /Receipt for order o(9|10)/.test(m.text)), 'the mail text should be the rendered receipt');
});

await check('handler: a bad record is reported in batchItemFailures and does not stop the others', async () => {
  outbox.length = 0;
  const result = await handler({ Records: [rec('bad-json', '{oops'), rec('ok', order), rec('bad-email', { ...order, email: 'nobody' })] });
  const failed = (result?.batchItemFailures ?? []).map((f) => f.itemIdentifier).sort();
  expectEqual(failed, ['bad-email', 'bad-json'], 'batchItemFailures: ');
  expect(outbox.length === 1 && outbox[0].to === 'grace@example.com', `sent ${outbox.length} mails`);
});
