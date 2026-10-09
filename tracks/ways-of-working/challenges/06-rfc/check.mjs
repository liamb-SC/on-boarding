import { check, expect } from '../../../../lib/checks.mjs';
import { isIsoDate, isPlaceholder, norm, person, read, section, words } from '../../wow-checks.mjs';

const md = read('rfcs/0001-quiet-hours.md');
const field = (name) => md.match(new RegExp(`^[-*\\s]*\\*{0,2}${name}:?\\*{0,2}:?[ \\t]*(.+)`, 'im'))?.[1]?.trim() ?? '';
const items = (s) => s.split('\n').filter((l) => /^\s*([-*]|\d+\.)\s+/.test(l))
  .map((l) => l.replace(/^\s*([-*]|\d+\.)\s+/, '').trim()).filter((l) => !isPlaceholder(l));
const body = (re, label) => section(md, re, label).body;

await check('the RFC has a real title: "# RFC 0001: <title>"', () => {
  const t = md.match(/^#\s+RFC\s*0*1:?\s*(.+)$/im)?.[1];
  expect(t && !isPlaceholder(t), 'replace <title>');
});

await check('Author and Created are filled in', () => {
  expect(!isPlaceholder(field('Author')), 'Author');
  expect(isIsoDate(norm(field('Created'))), `Created is "${field('Created')}"`);
});

await check('Status is Draft or In review (you can\'t accept your own RFC)', () =>
  expect(['draft', 'in review'].includes(norm(field('Status'))), `Status is "${field('Status')}"`));

await check('at least two Beacon team members are named as reviewers', () => {
  const names = field('Reviewers').split(/,|&|\band\b/).map(person).filter(Boolean);
  expect(new Set(names).size >= 2, 'e.g. "Tom Okafor, Priya Shah"');
});

await check('there\'s a comment deadline (YYYY-MM-DD) after the created date', () => {
  const by = norm(field('Comments by'));
  expect(isIsoDate(by), `Comments by is "${field('Comments by')}"`);
  expect(by > norm(field('Created')), 'give reviewers some time');
});

await check('Problem states the evidence: 41 complaints in September about late-night texts', () => {
  const p = norm(body(/^problem/, 'Problem'));
  expect(words(p) >= 30, `only ${words(p)} words. Who is affected, and how do we know?`);
  expect(/41/.test(p) && /complain/.test(p), 'quote the complaint numbers from the notes');
  expect(/(23:00|11 ?pm|scan|carrier|night)/.test(p), 'explain why it happens (carrier scans late at night)');
});

await check('Proposal is concrete: a quiet-hours window (HH:MM–HH:MM) and what happens to held texts', () => {
  const p = norm(body(/^proposal/, 'Proposal'));
  expect(words(p) >= 30, `only ${words(p)} words`);
  expect((p.match(/\b\d{1,2}:\d{2}\b/g) ?? []).length >= 2, 'give the window as times, e.g. 21:00–08:00');
  expect(/(hold|held|delay|defer|queue|postpone|wait)/.test(p), 'what happens to a text that arrives during quiet hours?');
  expect(/beacon-worker|worker/.test(p), 'where does it live? (which service)');
});

await check('at least two Alternatives, each with a reason it wasn\'t chosen', () => {
  const a = items(body(/^alternatives/, 'Alternatives considered'));
  expect(a.length >= 2, `found ${a.length}`);
  const thin = a.filter((x) => words(x) < 8);
  expect(!thin.length, `say why not: "${thin[0]}"`);
});

await check('at least two Open questions, phrased as questions', () => {
  const q = items(body(/^open questions/, 'Open questions')).filter((x) => /\?\s*$/.test(x));
  expect(q.length >= 2, `found ${q.length} items ending in "?"`);
});
