import { readdirSync } from 'node:fs';
import path from 'node:path';
import { check, expect, SANDBOX } from '../../../../lib/checks.mjs';
import { isPlaceholder, norm, read, section, table, words } from '../../wow-checks.mjs';

const DIR = 'docs/decisions';
let file, md;

await check('there is a new ADR named docs/decisions/0002-<kebab-title>.md', () => {
  file = readdirSync(path.join(SANDBOX, DIR)).find((f) => /^0002-[a-z0-9]+(-[a-z0-9]+)*\.md$/.test(f));
  expect(file, 'expected e.g. 0002-queue-delivery-texts-via-sqs.md');
  md = read(`${DIR}/${file}`);
});

const need = () => expect(md, 'write the ADR first');
const field = (name) => md.match(new RegExp(`^[-*\\s]*\\*{0,2}${name}:?\\*{0,2}:?[ \\t]*(.+)`, 'im'))?.[1]?.trim() ?? '';

await check('its title line is "# 0002. <title>"', () => {
  need();
  const t = md.match(/^#\s+0*2\.?\s+(.+)$/m)?.[1];
  expect(t && !isPlaceholder(t), 'first heading should look like "# 0002. Queue delivery texts via SQS"');
});

await check('Status is Accepted, Date is the decision day (2026-10-06), Deciders are named', () => {
  need();
  expect(norm(field('Status')) === 'accepted', `Status is "${field('Status')}". Priya agreed, so it's Accepted`);
  expect(norm(field('Date')) === '2026-10-06', `Date is "${field('Date')}". Use the day it was decided`);
  expect(/(priya|tom)/.test(norm(field('Deciders'))), 'who made the call in the meeting?');
});

await check('it has Context, Options considered, Decision and Consequences sections, all filled in', () => {
  need();
  for (const [re, label] of [[/^context/, 'Context'], [/^options/, 'Options considered'], [/^decision/, 'Decision'], [/^consequences/, 'Consequences']]) {
    const s = section(md, re, label);
    expect(!isPlaceholder(s.body) && words(s.body) >= 15, `"${label}" is empty or too short`);
  }
});

await check('Context captures the forces: the 50 msg/s rate limit and peak-day bursts', () => {
  need();
  const c = norm(section(md, /^context/).body);
  expect(/50/.test(c) && /rate/.test(c), 'mention TextBridge\'s rate limit (50 messages a second)');
  expect(/(peak|burst)/.test(c), 'mention the peak-day bursts');
});

await check('all three options are listed: direct synchronous call, SQS queue + worker, nightly batch', () => {
  need();
  const o = norm(section(md, /^options/).body);
  const items = o.split('\n').filter((l) => /^\s*(\d+\.|[-*])\s+/.test(l));
  expect(items.length >= 3, `found ${items.length} list items`);
  expect(/(direct|synchronous|sync)/.test(o), 'the direct/synchronous call option is missing');
  expect(/(queue|sqs)/.test(o), 'the queue option is missing');
  expect(/(batch|nightly)/.test(o), 'the nightly batch option is missing');
});

await check('the Decision names the queue (SQS + beacon-worker) and says why', () => {
  need();
  const d = norm(section(md, /^decision/).body);
  expect(/(queue|sqs)/.test(d), 'which option was chosen?');
  expect(/(because|so that|absorb|rate|retr|block)/.test(d), 'say why. That\'s what future readers need');
});

await check('Consequences list good AND bad effects, including the dead-letter queue + alerting', () => {
  need();
  const c = norm(section(md, /^consequences/).body);
  const items = c.split('\n').filter((l) => /^\s*(\d+\.|[-*])\s+/.test(l));
  expect(items.length >= 3, `found ${items.length} bullet points, want 3+`);
  expect(/(dead.?letter|dlq)/.test(c), 'Tom flagged the need for a dead-letter queue');
  expect(/(new service|operat|run|delay|seconds|later|cost)/.test(c), 'include a downside: what gets harder?');
});

await check('the decision log (docs/decisions/README.md) lists 0002 as Accepted, dated 2026-10-06', () => {
  const rows = table(read(`${DIR}/README.md`), ['adr', 'title', 'status', 'date'], 'the decision log').rows;
  const r = rows.find((x) => /0*2\b/.test(x.adr) && !/0001/.test(x.adr));
  expect(r, 'no row for ADR 0002');
  expect(norm(r.status) === 'accepted' && norm(r.date) === '2026-10-06', `got status "${r.status}", date "${r.date}"`);
  expect(file && r.adr.includes(file), `link the row to the file, e.g. [0002](${file ?? '0002-....md'})`);
  expect(rows.some((x) => /0001/.test(x.adr)), 'don\'t delete the 0001 row');
});
