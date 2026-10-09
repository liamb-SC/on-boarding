import { check, expect } from '../../../../lib/checks.mjs';
import { isIsoDate, isPlaceholder, norm, person, read, table, words } from '../../wow-checks.mjs';

const md = read('raid-log.md');
const TYPES = { r: 'risk', a: 'assumption', i: 'issue', d: 'dependency' };
let rows = [];
const some = () => expect(rows.length, 'no entries yet');

await check('raid-log.md has a table with ID, Type, Description, Owner, Impact, Mitigation and Status', () => {
  rows = table(md, ['id', 'type', 'description', 'owner', 'impact', 'mitigation', 'status'], 'the RAID table').rows;
});

await check('the "Last updated" date is filled in (YYYY-MM-DD)', () => {
  const d = md.match(/last updated:\s*\**\s*(\S+)/i)?.[1]?.replace(/\*/g, '');
  expect(d && isIsoDate(d), `got "${d ?? ''}"`);
});

await check('the log has at least 6 entries', () => expect(rows.length >= 6, `found ${rows.length}`));

await check('every Type is Risk, Assumption, Issue or Dependency, and all four are used', () => {
  some();
  const bad = rows.filter((r) => !Object.values(TYPES).includes(norm(r.type)));
  expect(!bad.length, `unknown type(s): ${bad.map((r) => r.type || '(blank)').join(', ')}`);
  const missing = Object.values(TYPES).filter((t) => !rows.some((r) => norm(r.type) === t));
  expect(!missing.length, `no ${missing.join(', ')} yet`);
});

await check('IDs are unique and prefixed by type (R1, A1, I1, D1...)', () => {
  some();
  const ids = rows.map((r) => norm(r.id));
  expect(new Set(ids).size === ids.length, 'duplicate IDs');
  const bad = rows.filter((r) => { const m = norm(r.id).match(/^([raid])-?\d+$/); return !m || TYPES[m[1]] !== norm(r.type); });
  expect(!bad.length, `check: ${bad.map((r) => r.id || '(blank)').join(', ')}`);
});

await check('every entry has one named owner from the Beacon team', () => {
  some();
  const bad = rows.filter((r) => !person(r.owner));
  expect(!bad.length, `${bad.map((r) => `${r.id}: "${r.owner}"`).join(', ')} (one person, e.g. "Aisha Khan")`);
});

await check('every Impact is High, Medium or Low and every Status is Open or Closed', () => {
  some();
  const bad = rows.filter((r) => !['high', 'medium', 'low'].includes(norm(r.impact)) || !['open', 'closed'].includes(norm(r.status)));
  expect(!bad.length, `check: ${bad.map((r) => r.id).join(', ')}`);
});

await check('every entry has a real description and a mitigation / next step', () => {
  some();
  const bad = rows.filter((r) => isPlaceholder(r.description) || words(r.description) < 4 || isPlaceholder(r.mitigation) || words(r.mitigation) < 3);
  expect(!bad.length, `too thin: ${bad.map((r) => r.id).join(', ')}`);
});

// Scenario facts from the brief and the kick-off transcript.
const find = (type, re) => rows.filter((r) => norm(r.type) === type && re.test(norm(`${r.description} ${r.mitigation}`)));

await check('the TextBridge sandbox-credentials delay is logged as a Dependency, owned by Aisha', () => {
  const hits = find('dependency', /(textbridge|vendor)/).filter((r) => /(credential|sandbox)/.test(norm(r.description)));
  expect(hits.length, 'no Dependency mentions the TextBridge sandbox credentials');
  expect(hits.some((r) => person(r.owner) === 'Aisha Khan'), 'Aisha owns the vendor relationship and said she\'d escalate');
});

await check('the pen test by the security team is logged as a Dependency', () =>
  expect(find('dependency', /(pen.?test|penetration|security)/).length, 'go-live depends on Sofia\'s penetration test'));

await check('missing the 20 November code freeze is logged as a Risk', () =>
  expect(find('risk', /(code freeze|freeze|20 nov|2026-11-20|go-live|deadline)/).length, 'what happens if the build slips past the freeze?'));

await check('"all phone numbers are in E.164 format" is logged as an Assumption', () =>
  expect(find('assumption', /(e\.?164|phone|number format)/).length, 'Tom: "We\'re assuming they are... nobody has checked"'));

await check('SMSPort dropping ~2% of texts is logged as an Issue, not a Risk (it\'s happening now)', () => {
  const re = /(2%|2 ?per ?cent|drop|smsport)/;
  expect(find('issue', re).length, 'no Issue about SMSPort dropping texts');
  const asRisk = find('risk', /(2%|dropp)/);
  expect(!asRisk.length, `${asRisk.map((r) => r.id).join(', ')}: a risk might happen. This one already is happening`);
});
