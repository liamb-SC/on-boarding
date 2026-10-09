import { check, expect } from '../../../../lib/checks.mjs';
import { isPlaceholder, norm, read, section, table, words } from '../../wow-checks.mjs';

const md = read('status-report.md');
const bullets = (s) => s.split('\n').filter((l) => /^\s*([-*]|\d+\.)\s+/.test(l) && !isPlaceholder(l.replace(/^\s*([-*]|\d+\.)\s+/, '')));
let rag = {};

await check('the reporting period is the week ending 2026-10-23, and the author is filled in', () => {
  expect(/week ending\s*\**\s*2026-10-23/i.test(md), 'set "week ending 2026-10-23"');
  const author = md.match(/\*\*author:\*\*\s*(.*)/i)?.[1] ?? '';
  expect(!isPlaceholder(author), 'put your name as author');
});

await check('the RAG table has Overall, Schedule, Scope and Budget, each Green, Amber or Red', () => {
  const rows = table(md, ['area', 'rag', 'commentary'], 'the RAG table').raw;
  for (const area of ['overall', 'schedule', 'scope', 'budget']) {
    const r = rows.find((x) => norm(x.area) === area);
    expect(r, `no ${area} row`);
    const v = norm(r.rag);
    expect(['green', 'amber', 'red'].includes(v), `${area}: "${r.rag}" (write Green, Amber or Red)`);
    rag[area] = { rag: v, note: r.commentary };
  }
});

// The expected ratings follow the RAG rules at the bottom of the notes.
const expectRag = (area, want, why) => check(`${area[0].toUpperCase()}${area.slice(1)} is rated by the rules`, () => {
  expect(rag[area], 'fill in the RAG table first');
  expect(rag[area].rag === want, `got ${rag[area].rag}. ${why}`);
});
await expectRag('schedule', 'amber', 'Forecast 18 Nov is after the 16 Nov target but before the 20 Nov freeze');
await expectRag('scope', 'amber', 'CR-01 is raised but not yet decided');
await expectRag('budget', 'red', '£138k against £120k is 15% over');
await expectRag('overall', 'red', 'Overall is the worst of the areas');

await check('every Amber/Red row says why, with the evidence (date, CR number, figures)', () => {
  expect(rag.budget, 'fill in the RAG table first');
  for (const [area, re, hint] of [
    ['schedule', /(18 nov|2026-11-18|18th)/, 'the forecast go-live date'],
    ['scope', /cr-?01/, 'the change request number'],
    ['budget', /(138|15 ?%|18k|18,000)/, 'the forecast or overspend figure'],
  ]) {
    const n = norm(rag[area].note);
    expect(words(n) >= 6 && re.test(n), `${area} commentary should include ${hint}`);
  }
});

await check('the Summary is short and real (15–80 words)', () => {
  const s = section(md, /^summary/, 'Summary').body;
  expect(!isPlaceholder(s), 'replace the placeholder');
  expect(words(s) >= 15 && words(s) <= 80, `it has ${words(s)} words`);
});

await check('Key risks and issues include the failed E.164 assumption (6% of numbers)', () => {
  const s = section(md, /^key risks/, 'Key risks and issues').body;
  expect(bullets(s).length >= 2, 'list at least 2');
  expect(/(e\.?164|6 ?%|phone)/.test(norm(s)), 'Ben\'s check found 6% of numbers are not E.164. That\'s now an issue');
});

await check('Decisions needed asks Priya to decide CR-01 and the budget overspend', () => {
  const raw = section(md, /^decisions/, 'Decisions needed').body;
  const s = norm(raw);
  expect(bullets(raw).length >= 2, 'list each decision as its own bullet');
  expect(/cr-?01/.test(s), 'CR-01 is waiting on a decision');
  expect(/(budget|£|138|overspend|spend)/.test(s), 'the overspend needs approving');
  expect(/priya/.test(s), 'say who has to decide');
});

await check('Next steps has at least 2 concrete items', () =>
  expect(bullets(section(md, /^next steps/, 'Next steps').body).length >= 2));
